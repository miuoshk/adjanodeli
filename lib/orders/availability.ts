"use server";

import { createServerClient } from "@/lib/supabase/server";

export type ProductAvailability = {
  product_id: string;
  cap: number;
  reserved: number;
  remaining: number;
  is_available: boolean;
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

  return data;
}
