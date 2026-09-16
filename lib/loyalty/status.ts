import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import type { VoucherType } from "@/lib/loyalty/discount";

const voucherSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["PCT10", "PCT50", "ONE_GROSZ"]),
  issued_at: z.string(),
  expires_at: z.string(),
});

const statusSchema = z.object({
  active_stamps: z.number().int().nonnegative(),
  next_threshold: z.number().int().positive(),
  vouchers: z.array(voucherSchema),
});

export type LoyaltyVoucher = {
  id: string;
  type: VoucherType;
  issued_at: string;
  expires_at: string;
};

export type LoyaltyStatus = {
  active_stamps: number;
  next_threshold: number;
  vouchers: LoyaltyVoucher[];
};

export function parseLoyaltyStatus(data: unknown): LoyaltyStatus | null {
  const parsed = statusSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function getLoyaltyStatus(userId: string): Promise<LoyaltyStatus | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc("loyalty_status", { p_user: userId });
    if (error || data == null) {
      return null;
    }
    return parseLoyaltyStatus(data);
  } catch {
    return null;
  }
}
