import { PRICE_RE, priceToGrosze } from "@/lib/admin/catalog";

export type ProductOptionDraft = {
  id: string | null;
  name: string;
  price: string;
  isActive: boolean;
  used: boolean;
};

export type ProductOptionGroupDraft = {
  id: string | null;
  name: string;
  isRequired: boolean;
  maxChoices: number;
  options: ProductOptionDraft[];
};

export type ParsedProductOption = {
  id: string | null;
  name: string;
  priceDeltaGrosze: number;
  isActive: boolean;
};

export type ParsedProductOptionGroup = {
  id: string | null;
  name: string;
  isRequired: boolean;
  maxChoices: number;
  options: ParsedProductOption[];
};

export function parseProductOptionDrafts(
  groups: ProductOptionGroupDraft[],
): { ok: true; groups: ParsedProductOptionGroup[] } | { ok: false; message: string } {
  if (groups.length > 8) {
    return { ok: false, message: "Najwyżej 8 grup." };
  }

  const parsed: ParsedProductOptionGroup[] = [];
  for (const group of groups) {
    const name = group.name.trim();
    if (!name) {
      return { ok: false, message: "Podaj nazwę grupy." };
    }
    if (!Number.isInteger(group.maxChoices) || group.maxChoices < 1 || group.maxChoices > 10) {
      return { ok: false, message: "Ile można wybrać: od 1 do 10." };
    }
    if (group.options.length > 20) {
      return { ok: false, message: "Najwyżej 20 opcji w grupie." };
    }

    const options: ParsedProductOption[] = [];
    for (const option of group.options) {
      const optionName = option.name.trim();
      if (!optionName) {
        return { ok: false, message: "Podaj nazwę opcji." };
      }
      const price = option.price.trim() === "" ? "0,00" : option.price.trim();
      if (!PRICE_RE.test(price)) {
        return { ok: false, message: "Dopłata jak 2,00." };
      }
      options.push({
        id: option.id,
        name: optionName,
        priceDeltaGrosze: priceToGrosze(price),
        isActive: option.isActive,
      });
    }

    parsed.push({
      id: group.id,
      name,
      isRequired: group.isRequired,
      maxChoices: group.maxChoices,
      options,
    });
  }

  return { ok: true, groups: parsed };
}
