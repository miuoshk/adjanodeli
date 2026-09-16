export const STRIPE_MIN_GROSZE = 200;

export type VoucherType = "PCT10" | "PCT50" | "ONE_GROSZ";

export type DiscountItem = {
  unitPriceGrosze: number;
  qty: number;
};

export function computeDiscount(type: VoucherType, items: DiscountItem[]): number {
  const subtotal = items.reduce((sum, item) => sum + item.unitPriceGrosze * item.qty, 0);

  if (type === "PCT10") {
    return Math.floor(subtotal / 10);
  }

  if (type === "PCT50") {
    return Math.min(Math.floor(subtotal / 2), 4000);
  }

  const cheapest = items.reduce(
    (min, item) => Math.min(min, item.unitPriceGrosze),
    Number.POSITIVE_INFINITY,
  );
  if (!Number.isFinite(cheapest) || cheapest <= 1) {
    return 0;
  }
  return cheapest - 1;
}

export function voucherLabel(type: VoucherType): string {
  if (type === "PCT10") {
    return "−10%";
  }
  if (type === "PCT50") {
    return "−50%";
  }
  return "najtańszy produkt za 1 gr";
}
