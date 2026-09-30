import { z } from "zod";

import type { StandingOrderItem } from "@/lib/standing-orders/types";

const itemsSchema = z
  .array(
    z.object({
      product_id: z.string().uuid(),
      qty: z.number().int().min(1),
      option_ids: z.array(z.string().uuid()).optional().default([]),
    }),
  )
  .min(1)
  .max(30);

export function parseStandingItems(value: unknown): StandingOrderItem[] {
  const parsed = itemsSchema.safeParse(value);
  if (!parsed.success) {
    return [];
  }
  return parsed.data.map((item) => ({
    product_id: item.product_id,
    qty: item.qty,
    option_ids: item.option_ids,
  }));
}
