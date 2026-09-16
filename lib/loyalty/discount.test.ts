import { describe, expect, it } from "vitest";

import { computeDiscount } from "./discount";

describe("computeDiscount", () => {
  it("PCT10 takes 10% of subtotal, floored", () => {
    expect(computeDiscount("PCT10", [{ unitPriceGrosze: 1000, qty: 1 }])).toBe(100);
    expect(computeDiscount("PCT10", [{ unitPriceGrosze: 1099, qty: 1 }])).toBe(109);
    expect(
      computeDiscount("PCT10", [
        { unitPriceGrosze: 800, qty: 2 },
        { unitPriceGrosze: 450, qty: 1 },
      ]),
    ).toBe(205);
  });

  it("PCT50 takes 50% of subtotal, capped at 40 zł", () => {
    expect(computeDiscount("PCT50", [{ unitPriceGrosze: 2000, qty: 1 }])).toBe(1000);
    expect(computeDiscount("PCT50", [{ unitPriceGrosze: 10000, qty: 1 }])).toBe(4000);
    expect(
      computeDiscount("PCT50", [
        { unitPriceGrosze: 1500, qty: 1 },
        { unitPriceGrosze: 700, qty: 1 },
      ]),
    ).toBe(1100);
  });

  it("ONE_GROSZ drops the cheapest unit to 1 gr", () => {
    expect(
      computeDiscount("ONE_GROSZ", [
        { unitPriceGrosze: 1200, qty: 1 },
        { unitPriceGrosze: 450, qty: 2 },
      ]),
    ).toBe(449);
    expect(computeDiscount("ONE_GROSZ", [{ unitPriceGrosze: 1, qty: 3 }])).toBe(0);
    expect(computeDiscount("ONE_GROSZ", [])).toBe(0);
  });
});
