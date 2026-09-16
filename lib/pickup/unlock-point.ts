"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { normalizeAccessCode } from "@/lib/pickup/access-code";
import { createServerClient } from "@/lib/supabase/server";

export type UnlockedPickupPoint = {
  id: string;
  name: string;
  description: string | null;
  pickup_from: string;
  pickup_to: string;
  weekdays: number[];
};

export type UnlockPickupPointResult =
  | ({ ok: true } & UnlockedPickupPoint)
  | { ok: false; code: "NOT_AUTHENTICATED" | "UNLOCK_INVALID" | "UNLOCK_RATE_LIMIT"; message: string };

function mapUnlockError(text: string): UnlockPickupPointResult {
  if (text.includes("UNLOCK_RATE_LIMIT")) {
    return { ok: false, code: "UNLOCK_RATE_LIMIT", message: "Spróbuj za 15 minut." };
  }
  if (text.includes("NOT_AUTHENTICATED")) {
    return { ok: false, code: "NOT_AUTHENTICATED", message: "Zaloguj się, żeby wpisać kod." };
  }
  return { ok: false, code: "UNLOCK_INVALID", message: "Nieprawidłowy kod" };
}

export async function unlockPickupPoint(code: string): Promise<UnlockPickupPointResult> {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false, code: "NOT_AUTHENTICATED", message: "Zaloguj się, żeby wpisać kod." };
  }

  const normalized = normalizeAccessCode(code);
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("unlock_pickup_point", { p_code: normalized });
  if (error || !data) {
    return mapUnlockError(error?.message ?? "");
  }

  const point = data as UnlockedPickupPoint;
  revalidatePath("/koszyk");
  revalidatePath("/konto");
  revalidatePath("/sklep");
  return {
    ok: true,
    id: point.id,
    name: point.name,
    description: point.description,
    pickup_from: point.pickup_from,
    pickup_to: point.pickup_to,
    weekdays: point.weekdays,
  };
}
