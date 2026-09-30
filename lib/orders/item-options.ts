export type ItemOption = {
  group_id: string;
  group_name: string;
  option_id: string;
  option_name: string;
  price_delta_grosze: number;
};

export type ShopOption = {
  id: string;
  name: string;
  priceDeltaGrosze: number;
  isActive: boolean;
};

export type ShopOptionGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  maxChoices: number;
  options: ShopOption[];
};

export function parseItemOptions(value: unknown): ItemOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const row = entry as Record<string, unknown>;
    if (typeof row.option_name !== "string" || typeof row.group_name !== "string") {
      return [];
    }
    return [
      {
        group_id: String(row.group_id ?? ""),
        group_name: row.group_name,
        option_id: String(row.option_id ?? ""),
        option_name: row.option_name,
        price_delta_grosze: Number(row.price_delta_grosze ?? 0),
      },
    ];
  });
}

export function optionPhrase(options: Pick<ItemOption, "group_name" | "option_name">[]): string {
  return options
    .map((option) => `${option.group_name.toLocaleLowerCase("pl")} ${option.option_name}`)
    .join(", ");
}

export function formatItemLine(
  qty: number,
  name: string,
  options: Pick<ItemOption, "group_name" | "option_name">[],
): string {
  const phrase = optionPhrase(options);
  return phrase ? `${qty}× ${name} (${phrase})` : `${qty}× ${name}`;
}

export function itemNameWithOptions(
  name: string,
  options: Pick<ItemOption, "group_name" | "option_name">[],
): string {
  const phrase = optionPhrase(options);
  return phrase ? `${name} (${phrase})` : name;
}

export function cartOptionLine(options: { groupName: string; optionName: string }[]): string {
  return options.map((option) => `${option.groupName}: ${option.optionName}`).join(", ");
}

export function cartLineKey(productId: string, optionIds: readonly string[]): string {
  return `${productId}:${[...optionIds].sort().join(",")}`;
}

export function missingRequiredGroupName(
  groups: ShopOptionGroup[],
  optionIds: readonly string[],
): string | null {
  for (const group of groups) {
    if (!group.isRequired) {
      continue;
    }
    const picked = group.options.some((option) => option.isActive && optionIds.includes(option.id));
    if (!picked) {
      return group.name;
    }
  }
  return null;
}

export function optionDeltaGrosze(groups: ShopOptionGroup[], optionIds: readonly string[]): number {
  let delta = 0;
  for (const group of groups) {
    for (const option of group.options) {
      if (option.isActive && optionIds.includes(option.id)) {
        delta += option.priceDeltaGrosze;
      }
    }
  }
  return delta;
}

export function hasUnknownOption(groups: ShopOptionGroup[], optionIds: readonly string[]): boolean {
  const known = new Set(
    groups.flatMap((group) => group.options.filter((option) => option.isActive).map((option) => option.id)),
  );
  return optionIds.some((id) => !known.has(id));
}
