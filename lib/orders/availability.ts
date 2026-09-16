"use server";

import { createServerClient } from "@/lib/supabase/server";

export type ProductAvailability = {
  product_id: string;
  cap: number;
  reserved: number;
  remaining: number;
  is_available: boolean;
  lead_days: number;
  earliest_date: string | null;
  effective_price_grosze: number | null;
  is_promo: boolean;
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export async function getAvailability(day: string): Promise<ProductAvailability[]> {
  if (!isoDate.test(day)) {
    return [];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("product_availability", { p_day: day });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const leadDays = "lead_days" in row ? Number(row.lead_days ?? 1) : 1;
    const earliest = "earliest_date" in row && row.earliest_date ? String(row.earliest_date).slice(0, 10) : null;
    return {
      product_id: row.product_id,
      cap: row.cap,
      reserved: row.reserved,
      remaining: row.remaining,
      is_available: row.is_available,
      lead_days: Number.isFinite(leadDays) && leadDays >= 1 ? leadDays : 1,
      earliest_date: earliest,
      effective_price_grosze:
        "effective_price_grosze" in row && typeof row.effective_price_grosze === "number"
          ? row.effective_price_grosze
          : null,
      is_promo: "is_promo" in row ? Boolean(row.is_promo) : false,
    };
  });
}
