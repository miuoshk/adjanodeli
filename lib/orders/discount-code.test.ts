import { describe, expect, it } from "vitest";

import { computeCodeDiscount } from "./discount-code";

describe("computeCodeDiscount", () => {
  it("applies percent with a max cap", () => {
    expect(
      computeCodeDiscount({
        type: "percent",
        value: 20,
        maxDiscountGrosze: 1000,
        subtotalGrosze: 8000,
      }),
    ).toEqual({ ok: true, discountGrosze: 1000 });
    expect(
      computeCodeDiscount({
        type: "percent",
        value: 10,
        subtotalGrosze: 2500,
      }),
    ).toEqual({ ok: true, discountGrosze: 250 });
  });

  it("applies a fixed amount without exceeding the subtotal", () => {
    expect(
      computeCodeDiscount({
        type: "amount",
        value: 1500,
        subtotalGrosze: 4000,
      }),
    ).toEqual({ ok: true, discountGrosze: 1500 });
    expect(
      computeCodeDiscount({
        type: "amount",
        value: 1500,
        subtotalGrosze: 900,
      }),
    ).toEqual({ ok: true, discountGrosze: 900 });
  });

  it("rejects a subtotal below min_order", () => {
    expect(
      computeCodeDiscount({
        type: "percent",
        value: 10,
        minOrderGrosze: 5000,
        subtotalGrosze: 4999,
      }),
    ).toEqual({ ok: false, reason: "min_order" });
    expect(
      computeCodeDiscount({
        type: "amount",
        value: 500,
        minOrderGrosze: 5000,
        subtotalGrosze: 5000,
      }),
    ).toEqual({ ok: true, discountGrosze: 500 });
  });
});
