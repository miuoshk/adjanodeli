import { z } from "zod";

import type { StandingOrderItem } from "@/lib/standing-orders/types";

const itemsSchema = z
  .array(
    z.object({
      product_id: z.string().uuid(),
      qty: z.number().int().min(1),
    }),
  )
  .min(1)
  .max(30);

export function parseStandingItems(value: unknown): StandingOrderItem[] {
  const parsed = itemsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
