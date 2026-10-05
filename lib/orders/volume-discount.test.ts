import { describe, expect, it } from "vitest";

import { computeDiscount } from "@/lib/loyalty/discount";
import {
  chooseOrderDiscount,
  parseVolumeTiers,
  volumeComparisonLine,
  volumeDiscountGrosze,
  volumePercent,
  volumeProgressLine,
  volumeShopLine,
  volumeTiersError,
} from "@/lib/orders/volume-discount";

const tiers = parseVolumeTiers([
  { min_qty: 20, pct: 10 },
  { min_qty: 40, pct: 20 },
]);

describe("volume discount", () => {
  it("starts at 20 pieces and steps up at 40", () => {
    expect(volumePercent(19, tiers, true)).toBeNull();
    expect(volumePercent(20, tiers, true)).toBe(10);
    expect(volumePercent(39, tiers, true)).toBe(10);
    expect(volumePercent(40, tiers, true)).toBe(20);
    expect(volumePercent(40, tiers, false)).toBeNull();
  });

  it("floors the amount the same way as a percent voucher", () => {
    expect(volumeDiscountGrosze(20000, 10)).toBe(2000);
    expect(volumeDiscountGrosze(39000, 10)).toBe(3900);
    expect(volumeDiscountGrosze(40000, 20)).toBe(8000);
    expect(volumeDiscountGrosze(1099, 10)).toBe(Math.floor(1099 / 10));
  });

  it("keeps the larger amount and leaves a tie with the chosen offer", () => {
    const voucher50 = computeDiscount("PCT50", [{ unitPriceGrosze: 1000, qty: 25 }]);
    const volume25 = volumeDiscountGrosze(25000, 10);
    expect(voucher50).toBe(4000);
    expect(volume25).toBe(2500);
    expect(
      chooseOrderDiscount({
        offerGrosze: voucher50,
        offerSource: "voucher",
        offerPct: 50,
        volumeGrosze: volume25,
        volumePct: 10,
      }).source,
    ).toBe("voucher");

    const voucher10 = computeDiscount("PCT10", [{ unitPriceGrosze: 1000, qty: 40 }]);
    const volume40 = volumeDiscountGrosze(40000, 20);
    expect(voucher10).toBe(4000);
    expect(volume40).toBe(8000);
    expect(
      chooseOrderDiscount({
        offerGrosze: voucher10,
        offerSource: "voucher",
        offerPct: 10,
        volumeGrosze: volume40,
        volumePct: 20,
      }).source,
    ).toBe("volume");

    expect(
      chooseOrderDiscount({
        offerGrosze: 1000,
        offerSource: "code",
        offerPct: 50,
        volumeGrosze: 8000,
        volumePct: 20,
      }),
    ).toEqual({ grosze: 8000, source: "volume", pct: 20 });

    expect(
      chooseOrderDiscount({
        offerGrosze: 2000,
        offerSource: "voucher",
        offerPct: 10,
        volumeGrosze: 2000,
        volumePct: 10,
      }).source,
    ).toBe("voucher");
  });

  it("writes the shop line, the progress line, and the comparison", () => {
    expect(volumeShopLine(tiers)).toBe("Od 20 sztuk −10%, od 40 sztuk −20%");
    expect(volumeProgressLine(17, tiers, true)).toBe("Jeszcze 3 sztuki do rabatu 10%");
    expect(volumeProgressLine(1, tiers, true)).toBe("Jeszcze 19 sztuk do rabatu 10%");
    expect(volumeProgressLine(20, tiers, true)).toBe("Jeszcze 20 sztuk do rabatu 20%");
    expect(volumeProgressLine(40, tiers, true)).toBeNull();
    expect(volumeProgressLine(17, tiers, false)).toBeNull();
    expect(
      volumeComparisonLine({
        enabled: true,
        volumeGrosze: 8000,
        offerGrosze: 4000,
        offerKind: "voucher",
      }),
    ).toBe("Rabat za ilość jest dla Ciebie lepszy. Voucher zostaje na następne zamówienie.");
    expect(
      volumeComparisonLine({
        enabled: true,
        volumeGrosze: 2500,
        offerGrosze: 4000,
        offerKind: "voucher",
      }),
    ).toBe("Voucher jest dla Ciebie lepszy. Rabat za ilość nie wchodzi.");
  });

  it("rejects a tier list the database would reject", () => {
    expect(volumeTiersError(tiers)).toBeNull();
    expect(volumeTiersError([{ minQty: 40, pct: 20 }, { minQty: 20, pct: 10 }])).toBe(
      "Progi mają iść od mniejszej liczby sztuk do większej.",
    );
    expect(volumeTiersError([{ minQty: 20, pct: 51 }])).toBe("Procent ma być od 1 do 50.");
  });
});
