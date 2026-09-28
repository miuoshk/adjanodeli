export type DeliveryLogRow = {
  order_id: string | null;
  status: string;
  created_at: string;
};

export type OrderNotice = {
  sent: boolean;
  sentAt: string | null;
  failed: boolean;
};

export function noticesFromLogs(rows: DeliveryLogRow[]): Map<string, OrderNotice> {
  const acc = new Map<string, { sentAt: string | null; latestAt: string; latestStatus: string }>();

  for (const row of rows) {
    if (!row.order_id) {
      continue;
    }
    const current = acc.get(row.order_id);
    if (!current) {
      acc.set(row.order_id, {
        sentAt: row.status === "sent" ? row.created_at : null,
        latestAt: row.created_at,
        latestStatus: row.status,
      });
      continue;
    }
    if (row.status === "sent" && (current.sentAt === null || row.created_at > current.sentAt)) {
      current.sentAt = row.created_at;
    }
    if (row.created_at >= current.latestAt) {
      current.latestAt = row.created_at;
      current.latestStatus = row.status;
    }
  }

  const result = new Map<string, OrderNotice>();
  for (const [orderId, value] of acc) {
    result.set(orderId, {
      sent: value.sentAt !== null,
      sentAt: value.sentAt,
      failed: value.sentAt === null && value.latestStatus === "failed",
    });
  }
  return result;
}

/** paid musi przejść przez in_production. Jedno wywołanie set_order_status na krok. */
export function stepsToArrived(status: string): Array<"in_production" | "delivered"> {
  if (status === "paid") {
    return ["in_production", "delivered"];
  }
  if (status === "in_production") {
    return ["delivered"];
  }
  return [];
}

export function arrivalConfirmLines(
  pointName: string,
  count: number,
  until: string,
  unstarted: number,
): string[] {
  const lines = [
    `Klienci z punktu ${pointName} (${count}) dostaną maila, że paczki czekają do ${until}.`,
  ];
  if (unstarted > 0) {
    lines.push(`${unstarted} z nich nie miało rozpoczętej produkcji, oznaczę je przy okazji.`);
  }
  return lines;
}
