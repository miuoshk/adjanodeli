import { describe, expect, it } from "vitest";

import {
  cartLineKey,
  formatItemLine,
  hasUnknownOption,
  missingRequiredGroupName,
  optionDeltaGrosze,
  parseItemOptions,
  type ShopOptionGroup,
} from "@/lib/orders/item-options";

const groups: ShopOptionGroup[] = [
  {
    id: "g1",
    name: "Sos",
    isRequired: true,
    maxChoices: 1,
    options: [
      { id: "a", name: "czosnkowy", priceDeltaGrosze: 0, isActive: true },
      { id: "b", name: "pomidorowy", priceDeltaGrosze: 200, isActive: true },
      { id: "c", name: "ostry", priceDeltaGrosze: 200, isActive: false },
    ],
  },
];

describe("formatItemLine", () => {
  it("keeps a plain product unchanged", () => {
    expect(formatItemLine(2, "Bułka", [])).toBe("2× Bułka");
  });

  it("puts the choice in parentheses", () => {
    expect(
      formatItemLine(2, "Kanapka z szynką", [
        {
          group_name: "Sos",
          option_name: "czosnkowy",
        },
      ]),
    ).toBe("2× Kanapka z szynką (sos czosnkowy)");
  });
});

describe("cart options", () => {
  it("splits the same product by option ids", () => {
    expect(cartLineKey("p", ["b", "a"])).toBe(cartLineKey("p", ["a", "b"]));
    expect(cartLineKey("p", ["a"])).not.toBe(cartLineKey("p", ["b"]));
  });

  it("blocks a missing required group and an inactive option", () => {
    expect(missingRequiredGroupName(groups, [])).toBe("Sos");
    expect(missingRequiredGroupName(groups, ["a"])).toBeNull();
    expect(hasUnknownOption(groups, ["c"])).toBe(true);
    expect(optionDeltaGrosze(groups, ["b"])).toBe(200);
  });

  it("reads an empty snapshot as no options", () => {
    expect(parseItemOptions(null)).toEqual([]);
  });
});
