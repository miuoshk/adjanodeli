import { redirect } from "next/navigation";

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

export async function requireRole(role: AppRole, next = "/") {
  await requireUser(next);
  const profile = await getProfile();

  const hasStaffAccess = profile?.role === "staff" || profile?.role === "owner";
  const hasOwnerAccess = profile?.role === "owner";
  const allowed = role === "owner" ? hasOwnerAccess : hasStaffAccess;

  if (!allowed) {
    const path = safeNextPath(next);
    if (path === "/admin" || path.startsWith("/admin/")) {
      redirect(`/admin/logowanie?next=${encodeURIComponent(path)}`);
    }
    redirect("/brak-dostepu");
  }

  return profile;
}
