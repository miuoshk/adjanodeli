"use server";

import { z } from "zod";

import { getSession } from "@/lib/auth";
import { normalizeDiscountCode } from "@/lib/orders/discount-code";
import { createServerClient } from "@/lib/supabase/server";

const checkSchema = z.object({
  code: z.string().min(1).max(40),
  subtotalGrosze: z.number().int().min(0),
  pickupPointId: z.string().uuid().nullable(),
});

export type CheckDiscountCodeResult =
  | { ok: true; discountGrosze: number; code: string }
  | { ok: false; message: string };

export async function checkDiscountCode(input: {
  code: string;
  subtotalGrosze: number;
  pickupPointId: string | null;
}): Promise<CheckDiscountCodeResult> {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false, message: "Zaloguj się, żeby użyć kodu." };
  }

  const parsed = checkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Kod jest nieprawidłowy." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("validate_discount_code", {
    p_code: parsed.data.code,
    p_subtotal: parsed.data.subtotalGrosze,
    p_pickup_point_id: parsed.data.pickupPointId as string,
  });

  if (error || data == null) {
    return { ok: false, message: "Nie udało się sprawdzić kodu." };
  }

  const row = data as { valid?: boolean; discount_grosze?: number; message?: string };
  if (!row.valid) {
    return { ok: false, message: row.message || "Kod jest nieprawidłowy." };
  }

  return {
    ok: true,
    discountGrosze: Number(row.discount_grosze ?? 0),
    code: normalizeDiscountCode(parsed.data.code),
  };
}
