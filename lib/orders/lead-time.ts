export type CartLeadItem = {
  productId: string;
  name: string;
  leadDays: number;
  earliestDate: string | null;
};

export function requiredLeadFromCart(items: { leadDays: number }[]): number {
  if (items.length === 0) {
    return 1;
  }
  return Math.max(1, ...items.map((item) => item.leadDays));
}

export function cartEarliestDate(items: { earliestDate: string | null }[]): string | null {
  const dates = items
    .map((item) => item.earliestDate)
    .filter((value): value is string => Boolean(value));
  if (dates.length === 0) {
    return null;
  }
  return dates.reduce((latest, value) => (value > latest ? value : latest));
}

export function blockingLeadItem(items: CartLeadItem[], day: string | null): CartLeadItem | null {
  if (!day) {
    return null;
  }
  let blocking: CartLeadItem | null = null;
  for (const item of items) {
    if (!item.earliestDate || day >= item.earliestDate) {
      continue;
    }
    if (!blocking || item.earliestDate > (blocking.earliestDate ?? "")) {
      blocking = item;
    }
  }
  return blocking;
}
