import { redirect } from "next/navigation";

import {
  canAccessSection,
  firstAllowedSection,
  type AccessLevel,
  type StaffPermission,
} from "@/lib/admin/staff-access";
import { safeNextPath } from "@/lib/safe-next";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AppRole = "staff" | "owner";

export async function getSession() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch {
    return null;
  }
}

export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function loginPathFor(next = "/"): string {
  const path = safeNextPath(next);
  if (path === "/admin" || path.startsWith("/admin/")) {
    return "/admin/logowanie";
  }
  return "/logowanie";
}

export async function requireUser(next = "/") {
  const session = await getSession();

  if (!session?.user) {
    const path = safeNextPath(next);
    redirect(`${loginPathFor(path)}?next=${encodeURIComponent(path)}`);
  }

  return session;
}

function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

export async function requireRole(role: AppRole, next = "/") {
  await requireUser(next);
  const profile = await getProfile();
  const path = safeNextPath(next);
  const hasStaffAccess = profile?.role === "staff" || profile?.role === "owner";
  const hasOwnerAccess = profile?.role === "owner";

  if (!profile || !hasStaffAccess) {
    if (isAdminPath(path)) {
      redirect(`/admin/logowanie?next=${encodeURIComponent(path)}`);
    }
    redirect("/brak-dostepu");
  }

  if (isAdminPath(path) && !profile.is_active) {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    redirect(`/admin/logowanie?next=${encodeURIComponent(path)}`);
  }

  if (isAdminPath(path) && profile.must_change_password && path !== "/admin/konto") {
    redirect("/admin/konto");
  }

  if (role === "owner" && !hasOwnerAccess) {
    redirect("/admin/brak-dostepu");
  }

  return profile;
}

export async function requireStaffPermission(
  permission: StaffPermission,
  next = "/admin",
  level: AccessLevel = "view",
) {
  const profile = await requireRole("staff", next);
  if (!canAccessSection(profile, permission, level)) {
    redirect("/admin/brak-dostepu");
  }
  return profile;
}

export async function requireAnyStaffPermission(
  permissions: readonly StaffPermission[],
  next = "/admin",
  level: AccessLevel = "view",
) {
  const profile = await requireRole("staff", next);
  if (!permissions.some((permission) => canAccessSection(profile, permission, level))) {
    redirect("/admin/brak-dostepu");
  }
  return profile;
}

export async function requireDashboard() {
  const profile = await requireRole("staff", "/admin");
  if (!canAccessSection(profile, "dashboard")) {
    redirect(firstAllowedSection(profile));
  }
  return profile;
}
