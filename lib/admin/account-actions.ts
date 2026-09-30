"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { firstAllowedSection } from "@/lib/admin/staff-access";
import { createClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function changeOwnPassword(
  password: string,
  confirm: string,
): Promise<{ error: string } | void> {
  const profile = await requireRole("staff", "/admin/konto");
  if (password.length < 10) {
    return { error: "Hasło ma mieć co najmniej 10 znaków." };
  }
  if (password !== confirm) {
    return { error: "Hasła się różnią." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Nie udało się zmienić hasła." };
  }

  try {
    const admin = createClient();
    const { error: flagError } = await admin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", profile.id);
    if (flagError) {
      return { error: "Hasło zapisane, ale panel jeszcze prosi o zmianę. Spróbuj jeszcze raz." };
    }
  } catch {
    return { error: "Hasło zapisane, ale panel jeszcze prosi o zmianę. Spróbuj jeszcze raz." };
  }

  revalidatePath("/admin", "layout");
  redirect(firstAllowedSection({ ...profile, must_change_password: false }));
}
