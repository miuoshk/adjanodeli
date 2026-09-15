import type { OrderStatus } from "@/lib/orders/status-labels";

export type StatusTransition = {
  status: OrderStatus;
  label: string;
  needsNote: boolean;
  ownerOnly: boolean;
};

export function getAvailableTransitions(
  status: string,
  isOwner: boolean,
): StatusTransition[] {
  const actions: StatusTransition[] = [];

  if (status === "paid") {
    actions.push({
      status: "in_production",
      label: "Do produkcji",
      needsNote: false,
      ownerOnly: false,
    });
  }

  if (status === "in_production") {
    actions.push({
      status: "delivered",
      label: "Dowiezione",
      needsNote: false,
      ownerOnly: false,
    });
  }

  if (status === "delivered") {
    actions.push({
      status: "picked_up",
      label: "Wydano",
      needsNote: false,
      ownerOnly: false,
    });
  }

  if ((status === "paid" || status === "in_production") && isOwner) {
    actions.push({
      status: "cancelled",
      label: "Anuluj",
      needsNote: true,
      ownerOnly: true,
    });
  }

  if (status === "cancelled" && isOwner) {
    actions.push({
      status: "refunded",
      label: "Oznacz jako zwrócone",
      needsNote: false,
      ownerOnly: true,
    });
  }

  return actions;
}
