"use server";

import { assembleShopOptionGroups } from "@/lib/orders/assemble-option-groups";
import type { ShopOptionGroup } from "@/lib/orders/item-options";
import { createServerClient } from "@/lib/supabase/server";

export async function loadShopOptionGroups(
  productIds: string[],
): Promise<Record<string, ShopOptionGroup[]>> {
  const ids = [...new Set(productIds)].filter(Boolean);
  if (ids.length === 0) {
    return {};
  }
  const supabase = await createServerClient();
  const { data: groups } = await supabase
    .from("product_option_groups")
    .select("id, product_id, name, is_required, max_choices, sort_order")
    .in("product_id", ids)
    .order("sort_order");

  const groupIds = (groups ?? []).map((group) => group.id);
  const { data: options } = groupIds.length
    ? await supabase
        .from("product_options")
        .select("id, group_id, name, price_delta_grosze, is_active, sort_order")
        .in("group_id", groupIds)
        .eq("is_active", true)
        .order("sort_order")
    : { data: [] };

  return assembleShopOptionGroups(groups ?? [], options ?? []);
}
