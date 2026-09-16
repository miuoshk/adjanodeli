"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-next";
import { createServerClient } from "@/lib/supabase/server";

async function appOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

const emailSchema = z.string().trim().email("Podaj prawidłowy e-mail.");

const phoneSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => {
    if (!value) {
      return true;
    }
    const compact = value.replace(/\s+/g, "");
    return /^\+48\d{9}$/.test(compact) || /^\d{9}$/.test(compact);
  }, "Podaj 9 cyfr, możesz dodać +48.");

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Podaj imię i nazwisko."),
  phone: phoneSchema,
  marketing_consent: z.boolean(),
  next: z.string().optional(),
});

function safeAdminNext(next?: string): string {
  const path = safeNextPath(next);
  if (path === "/admin" || (path.startsWith("/admin/") && path !== "/admin/logowanie")) {
    return path;
  }
  return "/admin";
}

function normalizePhone(phone: string | undefined): string | null {
  if (!phone) {
    return null;
  }
  const compact = phone.replace(/\s+/g, "");
  if (/^\d{9}$/.test(compact)) {
    return `+48${compact}`;
  }
  return compact;
}

export async function sendOtp(email: string) {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Podaj prawidłowy e-mail." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${await appOrigin()}/`,
    },
  });

  if (error) {
    return { error: "Nie udało się wysłać kodu. Spróbuj za chwilę." };
  }

  return { ok: true as const };
}

export async function verifyOtp(email: string, token: string, next?: string) {
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { error: parsedEmail.error.issues[0]?.message ?? "Podaj prawidłowy e-mail." };
  }

  const parsedToken = z
    .string()
    .regex(/^\d{6,8}$/, "Wpisz cały kod z maila.")
    .safeParse(token.trim());

  if (!parsedToken.success) {
    return { error: parsedToken.error.issues[0]?.message ?? "Wpisz cały kod z maila." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsedEmail.data,
    token: parsedToken.data,
    type: "email",
  });

  if (error) {
    return { error: "Kod jest nieprawidłowy albo wygasł." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nextPath = safeNextPath(next);

  if (user) {
    await supabase.rpc("sync_domain_access", { p_user_id: user.id });

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.full_name) {
      redirect(`/konto/uzupelnij?next=${encodeURIComponent(nextPath)}`);
    }
  }

  redirect(nextPath);
}

export async function updateProfile(input: {
  full_name: string;
  phone?: string;
  marketing_consent: boolean;
  next?: string;
}) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Sprawdź dane w formularzu." };
  }

  const session = await requireUser("/konto");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: normalizePhone(parsed.data.phone),
      marketing_consent: parsed.data.marketing_consent,
    })
    .eq("id", session.user.id);

  if (error) {
    return { error: "Nie udało się zapisać danych. Spróbuj jeszcze raz." };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(parsed.data.next ?? "/konto"));
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutAdmin() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/logowanie");
}

export async function signInAdmin(input: { username: string; password: string; next?: string }) {
  const login = input.username.trim().toLowerCase();
  if (!login || !input.password) {
    return { error: "Zły login albo hasło." };
  }

  const supabase = await createServerClient();
  const { data: email } = await supabase.rpc("admin_login_email", { p_login: login });
  if (!email) {
    return { error: "Zły login albo hasło." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    return { error: "Zły login albo hasło." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  if (profile?.role !== "staff" && profile?.role !== "owner") {
    await supabase.auth.signOut();
    return { error: "Zły login albo hasło." };
  }

  revalidatePath("/", "layout");
  redirect(safeAdminNext(input.next));
}
