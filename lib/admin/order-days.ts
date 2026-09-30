export type AdminOrderDay = {
  day: string;
  count: number;
};

/** Dziś, jutro i dni z zamówień. Bez duplikatów, rosnąco. */
export function buildAdminOrderDays(
  today: string,
  tomorrow: string,
  pickupDates: string[],
): AdminOrderDay[] {
  const counts = new Map<string, number>();
  for (const day of pickupDates) {
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  if (!counts.has(today)) {
    counts.set(today, 0);
  }
  if (!counts.has(tomorrow)) {
    counts.set(tomorrow, 0);
  }
  return [...counts.keys()]
    .sort()
    .map((day) => ({ day, count: counts.get(day) ?? 0 }));
}
