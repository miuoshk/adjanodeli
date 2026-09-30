import type { ShopOptionGroup } from "@/lib/orders/item-options";

type GroupRow = {
  id: string;
  product_id: string;
  name: string;
  is_required: boolean;
  max_choices: number;
};

type OptionRow = {
  id: string;
  group_id: string;
  name: string;
  price_delta_grosze: number;
  is_active: boolean;
};

export function assembleShopOptionGroups(
  groups: GroupRow[],
  options: OptionRow[],
): Record<string, ShopOptionGroup[]> {
  const optionsByGroup = new Map<string, ShopOptionGroup["options"]>();
  for (const option of options) {
    if (!option.is_active) {
      continue;
    }
    const list = optionsByGroup.get(option.group_id) ?? [];
    list.push({
      id: option.id,
      name: option.name,
      priceDeltaGrosze: option.price_delta_grosze,
      isActive: option.is_active,
    });
    optionsByGroup.set(option.group_id, list);
  }

  const byProduct: Record<string, ShopOptionGroup[]> = {};
  for (const group of groups) {
    const list = byProduct[group.product_id] ?? [];
    list.push({
      id: group.id,
      name: group.name,
      isRequired: group.is_required,
      maxChoices: group.max_choices,
      options: optionsByGroup.get(group.id) ?? [],
    });
    byProduct[group.product_id] = list;
  }
  return byProduct;
}
