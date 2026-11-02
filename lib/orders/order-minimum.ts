import { formatPrice } from "@/lib/format";
import { ORDER_MIN_GROSZE } from "@/lib/loyalty/discount";

/** One order at a pickup point. The shop floor still applies. */
export function orderMinimumGrosze(pointMin: number | null | undefined): number {
  if (pointMin == null || !Number.isInteger(pointMin)) {
    return ORDER_MIN_GROSZE;
  }
  return Math.max(ORDER_MIN_GROSZE, pointMin);
}

export function belowMinimumMessage(minGrosze: number, afterDiscount: boolean): string {
  const price = formatPrice(minGrosze);
  if (minGrosze > ORDER_MIN_GROSZE) {
    if (afterDiscount) {
      return `Po rabacie na ten punkt zostaje za mało. Jedno zamówienie musi mieć min. ${price}.`;
    }
    return `Na ten punkt jedno zamówienie musi mieć min. ${price}. Zbierzcie się i złóżcie je raz.`;
  }
  if (afterDiscount) {
    return `Dodaj jeszcze produkt — po rabacie zamówienie musi mieć min. ${price}.`;
  }
  return `Dodaj jeszcze coś — zamówienie musi mieć min. ${price}.`;
}

export function minimumFromOrderError(text: string): number {
  const match = text.match(/TOTAL_BELOW_MINIMUM:(\d+)/);
  if (!match) {
    return ORDER_MIN_GROSZE;
  }
  return orderMinimumGrosze(Number.parseInt(match[1], 10));
}
