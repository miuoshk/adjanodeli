export const DISCOUNT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type DiscountCodeType = "percent" | "amount";

export function generateDiscountCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => DISCOUNT_CODE_ALPHABET[byte % DISCOUNT_CODE_ALPHABET.length]).join("");
}

export function normalizeDiscountCode(value: string): string {
  return value.trim().replaceAll(" ", "").toUpperCase();
}

export function computeCodeDiscount(input: {
  type: DiscountCodeType;
  value: number;
  minOrderGrosze?: number;
  maxDiscountGrosze?: number | null;
  subtotalGrosze: number;
}): { ok: true; discountGrosze: number } | { ok: false; reason: "min_order" } {
  const minOrder = input.minOrderGrosze ?? 0;
  if (input.subtotalGrosze < minOrder) {
    return { ok: false, reason: "min_order" };
  }

  const raw =
    input.type === "percent"
      ? Math.floor((input.subtotalGrosze * input.value) / 100)
      : input.value;
  const capped = input.maxDiscountGrosze == null ? raw : Math.min(raw, input.maxDiscountGrosze);
  return { ok: true, discountGrosze: Math.max(0, Math.min(input.subtotalGrosze, capped)) };
}
