const CARD_STATUSES = new Set(["delivered", "paid", "in_production"]);

export type AccountOrderGroups<T extends { status: string }> = {
  waiting: T[];
  preparing: T[];
  recent: T[];
};

/** Karty na /konto: odbiór i przygotowanie. Reszta: trzy najnowsze. Kolejność wejścia zostaje. */
export function groupAccountOrders<T extends { status: string }>(
  orders: T[],
): AccountOrderGroups<T> {
  return {
    waiting: orders.filter((order) => order.status === "delivered"),
    preparing: orders.filter(
      (order) => order.status === "paid" || order.status === "in_production",
    ),
    recent: orders.filter((order) => !CARD_STATUSES.has(order.status)).slice(0, 3),
  };
}
