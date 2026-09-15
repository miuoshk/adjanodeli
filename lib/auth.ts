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

export async function requireUser(next = "/") {
  const session = await getSession();

  if (!session?.user) {
    redirect(`/logowanie?next=${encodeURIComponent(safeNextPath(next))}`);
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
    redirect("/brak-dostepu");
  }

  return profile;
}
