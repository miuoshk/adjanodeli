export function emailKindLabel(kind: string): string {
  switch (kind) {
    case "order_paid":
      return "Potwierdzenie zakupu";
    case "order_delivered":
      return "Paczka czeka";
    case "standing_reminder":
      return "Przypomnienie o stałym";
    case "special_request_owner":
      return "Zamówienie specjalne";
    case "manual_refund_owner":
      return "Zwrot ręczny";
    case "paid_after_expiry_owner":
      return "Zapłacone po wygaśnięciu";
    case "pickup_point_changed":
      return "Zmiana punktu odbioru";
    case "test":
      return "Test";
    default:
      return kind;
  }
}

export function emailStatusLabel(status: string): string {
  if (status === "sent") {
    return "Wysłany";
  }
  if (status === "failed") {
    return "Nie doszedł";
  }
  if (status === "skipped") {
    return "Pominięty";
  }
  return status;
}
