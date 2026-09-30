"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import {
  STAFF_PERMISSIONS,
  normalizePermissions,
  tempPasswordCharsetOk,
} from "@/lib/admin/staff-access";
import { createClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = ReturnType<typeof createClient>;
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const SAVE_ERROR = "Nie udało się zapisać.";
const LAST_OWNER = "Musi zostać choć jedna aktywna właścicielka.";
const SELF_ROLE = "Nie odbierzesz roli sobie.";
const CONFIRM_OWNER = "Potwierdź pełny dostęp właściciela.";
const SHOP_ACCOUNT = "Ten adres ma już konto w sklepie. Nadać mu dostęp do panelu?";
const ALREADY_TEAM = "Ten adres jest już w zespole.";

const addSchema = z.object({
  fullName: z.string().trim().min(1, "Podaj imię i nazwisko.").max(120),
  email: z.string().trim().email("Podaj prawidłowy e-mail."),
  permissions: z.array(z.enum(STAFF_PERMISSIONS)),
  password: z.string().refine(tempPasswordCharsetOk, "Wygeneruj hasło."),
  ownerAccess: z.boolean(),
  confirmOwner: z.boolean(),
  confirmShopAccount: z.boolean(),
});

const editSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(1, "Podaj imię i nazwisko.").max(120),
  permissions: z.array(z.enum(STAFF_PERMISSIONS)),
  ownerAccess: z.boolean(),
  confirmOwner: z.boolean(),
});

export type TeamActionResult =
  | { ok: true; password?: string }
  | { ok: false; error: string; needsShopAccount?: boolean };

function service(): AdminClient | null {
  try {
    return createClient();
  } catch {
    return null;
  }
}

function refresh() {
  revalidatePath("/admin", "layout");
}

async function otherActiveOwners(admin: AdminClient, exceptId: string): Promise<number> {
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner")
    .eq("is_active", true)
    .neq("id", exceptId);
  return count ?? 0;
}

async function saveProfile(admin: AdminClient, id: string, patch: ProfileUpdate): Promise<boolean> {
  const { error } = await admin.from("profiles").update(patch).eq("id", id);
  return !error;
}

export async function addTeamMember(input: z.infer<typeof addSchema>): Promise<TeamActionResult> {
  await requireRole("owner", "/admin/zespol");
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? SAVE_ERROR };
  }
  const data = parsed.data;
  if (data.ownerAccess && !data.confirmOwner) {
    return { ok: false, error: CONFIRM_OWNER };
  }

  const admin = service();
  if (!admin) {
    return { ok: false, error: SAVE_ERROR };
  }

  const email = data.email.toLowerCase();
  const { data: matches } = await admin.from("profiles").select("id, role, email").ilike("email", email);
  const existing = (matches ?? []).find((row) => row.email.toLowerCase() === email) ?? null;
  const role = data.ownerAccess ? "owner" : "staff";
  const patch: ProfileUpdate = {
    role,
    full_name: data.fullName,
    staff_permissions: normalizePermissions(data.permissions),
    is_active: true,
    must_change_password: true,
  };

  if (existing && (existing.role === "staff" || existing.role === "owner")) {
    return { ok: false, error: ALREADY_TEAM };
  }

  if (existing?.role === "customer") {
    if (!data.confirmShopAccount) {
      return { ok: false, error: SHOP_ACCOUNT, needsShopAccount: true };
    }
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: data.password,
      email_confirm: true,
    });
    if (error || !(await saveProfile(admin, existing.id, patch))) {
      return { ok: false, error: SAVE_ERROR };
    }
    refresh();
    return { ok: true, password: data.password };
  }

  const created = await admin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    return { ok: false, error: created.error?.message?.toLowerCase().includes("already") ? ALREADY_TEAM : SAVE_ERROR };
  }

  const saved = await saveProfile(admin, created.data.user.id, patch);
  if (!saved) {
    await admin.auth.admin.deleteUser(created.data.user.id);
    return { ok: false, error: SAVE_ERROR };
  }
  refresh();
  return { ok: true, password: data.password };
}

export async function updateTeamMember(input: z.infer<typeof editSchema>): Promise<TeamActionResult> {
  const caller = await requireRole("owner", "/admin/zespol");
  const parsed = editSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? SAVE_ERROR };
  }
  const data = parsed.data;
  if (data.ownerAccess && !data.confirmOwner) {
    return { ok: false, error: CONFIRM_OWNER };
  }
  if (caller.id === data.id && !data.ownerAccess) {
    return { ok: false, error: SELF_ROLE };
  }

  const admin = service();
  if (!admin) {
    return { ok: false, error: SAVE_ERROR };
  }

  const { data: target } = await admin
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", data.id)
    .maybeSingle();
  if (!target || (target.role !== "staff" && target.role !== "owner")) {
    return { ok: false, error: SAVE_ERROR };
  }

  const staysOwner = data.ownerAccess && target.is_active;
  if (target.role === "owner" && target.is_active && !staysOwner) {
    if ((await otherActiveOwners(admin, target.id)) < 1) {
      return { ok: false, error: LAST_OWNER };
    }
  }

  const saved = await saveProfile(admin, target.id, {
    full_name: data.fullName,
    role: data.ownerAccess ? "owner" : "staff",
    staff_permissions: normalizePermissions(data.permissions),
  });
  if (!saved) {
    return { ok: false, error: SAVE_ERROR };
  }
  refresh();
  return { ok: true };
}

export async function setTeamMemberActive(id: string, isActive: boolean): Promise<TeamActionResult> {
  await requireRole("owner", "/admin/zespol");
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: SAVE_ERROR };
  }
  const admin = service();
  if (!admin) {
    return { ok: false, error: SAVE_ERROR };
  }
  const { data: target } = await admin
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", id)
    .maybeSingle();
  if (!target || (target.role !== "staff" && target.role !== "owner")) {
    return { ok: false, error: SAVE_ERROR };
  }
  if (!isActive && target.role === "owner" && target.is_active) {
    if ((await otherActiveOwners(admin, target.id)) < 1) {
      return { ok: false, error: LAST_OWNER };
    }
  }
  const saved = await saveProfile(admin, id, { is_active: isActive });
  if (!saved) {
    return { ok: false, error: SAVE_ERROR };
  }
  refresh();
  return { ok: true };
}

export async function setTeamMemberPassword(id: string, password: string): Promise<TeamActionResult> {
  await requireRole("owner", "/admin/zespol");
  if (!z.string().uuid().safeParse(id).success || !tempPasswordCharsetOk(password)) {
    return { ok: false, error: "Wygeneruj hasło." };
  }
  const admin = service();
  if (!admin) {
    return { ok: false, error: SAVE_ERROR };
  }
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error || !(await saveProfile(admin, id, { must_change_password: true }))) {
    return { ok: false, error: SAVE_ERROR };
  }
  refresh();
  return { ok: true, password };
}
