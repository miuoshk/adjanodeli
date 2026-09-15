export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "in_production"
  | "delivered"
  | "picked_up"
  | "expired"
  | "cancelled"
  | "refunded";

export type OrderStatusMeta = {
  label: string;
  color: string;
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, OrderStatusMeta> = {
  pending_payment: { label: "Czeka na płatność", color: "#6B6A4A" },
  paid: { label: "Opłacone", color: "#4B4A2F" },
  in_production: { label: "W produkcji", color: "#4B4A2F" },
  delivered: { label: "Do odbioru", color: "#C4161C" },
  picked_up: { label: "Odebrane", color: "#2B2A1F" },
  expired: { label: "Wygasło", color: "#6B6A4A" },
  cancelled: { label: "Anulowane", color: "#6B6A4A" },
  refunded: { label: "Zwrócone", color: "#6B6A4A" },
};

export function isOrderStatus(status: string): status is OrderStatus {
  return status in ORDER_STATUS_LABELS;
}

export function orderStatusMeta(status: string): OrderStatusMeta {
  if (isOrderStatus(status)) {
    return ORDER_STATUS_LABELS[status];
  }
  return { label: status, color: "#6B6A4A" };
}

export const STATUSES_WITH_PICKUP_CODE = ["paid", "in_production", "delivered"] as const;
