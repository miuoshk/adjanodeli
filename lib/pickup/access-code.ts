import { DISCOUNT_CODE_ALPHABET } from "@/lib/orders/discount-code";

export function generateAccessCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => DISCOUNT_CODE_ALPHABET[byte % DISCOUNT_CODE_ALPHABET.length]).join("");
}

export function normalizeAccessCode(value: string): string {
  return value.trim().replaceAll(" ", "").toUpperCase();
}

export function isValidAccessCode(value: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(normalizeAccessCode(value));
}

export function inviteLinkForCode(code: string, origin?: string): string {
  const base = (origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/punkt/${normalizeAccessCode(code)}`;
}
