import { describe, expect, it } from "vitest";

import { blockingLeadItem, cartEarliestDate, requiredLeadFromCart } from "./lead-time";

describe("requiredLeadFromCart", () => {
  it("returns 1 for an empty cart", () => {
    expect(requiredLeadFromCart([])).toBe(1);
  });

  it("returns the max lead from cart items", () => {
    expect(requiredLeadFromCart([{ leadDays: 1 }, { leadDays: 2 }, { leadDays: 1 }])).toBe(2);
    expect(requiredLeadFromCart([{ leadDays: 1 }])).toBe(1);
    expect(requiredLeadFromCart([{ leadDays: 3 }, { leadDays: 7 }])).toBe(7);
  });
});

describe("cartEarliestDate", () => {
  it("returns the latest earliest date", () => {
    expect(
      cartEarliestDate([
        { earliestDate: "2026-09-18" },
        { earliestDate: "2026-09-21" },
        { earliestDate: null },
      ]),
    ).toBe("2026-09-21");
  });

  it("returns null when nothing has an earliest date", () => {
    expect(cartEarliestDate([{ earliestDate: null }])).toBeNull();
  });
});

describe("blockingLeadItem", () => {
  it("picks the item that pushes the day the furthest", () => {
    const cake = {
      productId: "a",
      name: "Tort",
      leadDays: 2,
      earliestDate: "2026-09-21",
    };
    const bun = {
      productId: "b",
      name: "Bułka",
      leadDays: 1,
      earliestDate: "2026-09-18",
    };
    expect(blockingLeadItem([cake, bun], "2026-09-18")?.productId).toBe("a");
    expect(blockingLeadItem([cake, bun], "2026-09-21")).toBeNull();
  });
});
