"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/admin";

const idSchema = z.string().uuid();

export async function setCustomerBanned(
  userId: string,
  banned: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("owner", "/admin/klienci");
  const parsed = idSchema.safeParse(userId);
  if (!parsed.success) {
    return { ok: false, error: "Nie udało się zapisać." };
  }

  let admin: ReturnType<typeof createClient>;
  try {
    admin = createClient();
  } catch (error) {
    console.error("[klienci]", error);
    return { ok: false, error: "Nie udało się zapisać." };
  }

  const { data: profile, error: readError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", parsed.data)
    .maybeSingle();

  if (readError || !profile) {
    console.error("[klienci]", readError?.message ?? "brak profilu");
    return { ok: false, error: "Nie udało się zapisać." };
  }

  if (profile.role !== "customer") {
    return { ok: false, error: "To konto nie jest klientem." };
  }

  const { error } = await admin
    .from("profiles")
    .update({ is_banned: banned })
    .eq("id", parsed.data);

  if (error) {
    console.error("[klienci]", error.message);
    return { ok: false, error: "Nie udało się zapisać." };
  }

  revalidatePath("/admin/klienci");
  return { ok: true };
}
