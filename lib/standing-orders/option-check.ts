import {
  missingRequiredGroupName,
  optionDeltaGrosze,
  type ShopOptionGroup,
} from "@/lib/orders/item-options";
import type { CartOption } from "@/lib/store/cart";

export function standingOptionIssue(groups: ShopOptionGroup[], optionIds: readonly string[]): string | null {
  const known = new Set(
    groups.flatMap((group) => group.options.filter((option) => option.isActive).map((option) => option.id)),
  );
  if (optionIds.some((id) => !known.has(id))) {
    return groups.find((group) => group.isRequired)?.name ?? groups[0]?.name ?? "dodatek";
  }
  return missingRequiredGroupName(groups, optionIds);
}

export function standingOptionMessage(productName: string, groupName: string): string {
  return `${productName}: wybierz ${groupName.toLocaleLowerCase("pl")} jeszcze raz`;
}

export function standingChosenOptions(
  groups: ShopOptionGroup[],
  optionIds: readonly string[],
): { options: CartOption[]; delta: number } {
  const options = groups.flatMap((group) =>
    group.options
      .filter((option) => option.isActive && optionIds.includes(option.id))
      .map((option) => ({ groupName: group.name, optionName: option.name })),
  );
  return { options, delta: optionDeltaGrosze(groups, optionIds) };
}
