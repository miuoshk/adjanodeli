import { NextResponse } from "next/server";

import { buildOrdersCsv } from "@/lib/admin/export-orders";
import { isOrderStatus } from "@/lib/orders/status-labels";

export const runtime = "nodejs";

function parseStatuses(url: URL): string[] {
  return url.searchParams
    .getAll("status")
    .flatMap((value) => value.split(","))
    .filter((item) => isOrderStatus(item));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dayParam = url.searchParams.get("dzien");
  const day =
    dayParam === "wszystkie" || (dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam))
      ? dayParam
      : "wszystkie";

  const result = await buildOrdersCsv({
    day,
    pointId: url.searchParams.get("punkt"),
    statuses: parseStatuses(url),
    q: url.searchParams.get("q") ?? "",
    invoiceOnly: url.searchParams.get("faktura") === "1",
  });

  if (!result.ok) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"zamowienia.csv\"",
    },
  });
}
