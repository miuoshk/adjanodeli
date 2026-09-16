import { getProfile } from "@/lib/auth";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice } from "@/lib/format";
import { createServerClient } from "@/lib/supabase/server";
import { orderStatusMeta } from "@/lib/orders/status-labels";
import type { Tables } from "@/lib/supabase/database.types";

type ExportOrder = Pick<
  Tables<"orders">,
  | "order_number"
  | "customer_name"
  | "customer_email"
  | "customer_phone"
  | "pickup_date"
  | "status"
  | "total_grosze"
  | "discount_grosze"
  | "discount_code_id"
  | "invoice_requested"
  | "invoice_nip"
  | "invoice_company"
  | "invoice_address"
> & {
  pickup_points: { name: string } | { name: string }[] | null;
};

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

function pointName(value: ExportOrder["pickup_points"]): string {
  if (Array.isArray(value)) {
    return value[0]?.name ?? "";
  }
  return value?.name ?? "";
}

function escapeIlike(value: string): string {
  return value.replace(/[%_,]/g, "").trim();
}

export async function buildOrdersCsv(filters: {
  day: string | "wszystkie";
  pointId: string | null;
  statuses: string[];
  q: string;
  invoiceOnly: boolean;
}): Promise<{ ok: true; csv: string } | { ok: false }> {
  const profile = await getProfile();
  if (profile?.role !== "owner") {
    return { ok: false };
  }

  const supabase = await createServerClient();
  let query = supabase
    .from("orders")
    .select(
      "order_number, customer_name, customer_email, customer_phone, pickup_date, status, total_grosze, discount_grosze, discount_code_id, invoice_requested, invoice_nip, invoice_company, invoice_address, pickup_points(name)",
    )
    .order("pickup_date", { ascending: true })
    .order("order_number", { ascending: true });

  if (filters.day !== "wszystkie") {
    query = query.eq("pickup_date", filters.day);
  }
  if (filters.pointId) {
    query = query.eq("pickup_point_id", filters.pointId);
  }
  if (filters.statuses.length > 0) {
    query = query.in("status", filters.statuses);
  }
  if (filters.invoiceOnly) {
    query = query.eq("invoice_requested", true);
  }

  const q = escapeIlike(filters.q);
  if (q) {
    const clauses = [
      `customer_name.ilike.%${q}%`,
      `customer_phone.ilike.%${q}%`,
      `pickup_code.ilike.%${q}%`,
    ];
    if (/^\d+$/.test(q)) {
      clauses.push(`order_number.eq.${q}`);
    }
    query = query.or(clauses.join(","));
  }

  const { data } = await query;
  const rows = (data ?? []) as ExportOrder[];

  const header = [
    "numer",
    "klient",
    "email",
    "telefon",
    "punkt",
    "dzien",
    "status",
    "suma",
    "rabat",
    "zrodlo_rabatu",
    "faktura",
    "nip",
    "firma",
    "adres",
  ];

  const lines = [
    header.join(","),
    ...rows.map((order) =>
      [
        String(order.order_number),
        order.customer_name,
        order.customer_email,
        order.customer_phone ?? "",
        pointName(order.pickup_points),
        formatDatePl(parseDateOnly(order.pickup_date)),
        orderStatusMeta(order.status).label,
        formatPrice(order.total_grosze),
        order.discount_grosze > 0 ? formatPrice(order.discount_grosze) : "",
        order.discount_grosze > 0 ? (order.discount_code_id ? "kod" : "voucher") : "",
        order.invoice_requested ? "tak" : "nie",
        order.invoice_nip ?? "",
        order.invoice_company ?? "",
        order.invoice_address ?? "",
      ]
        .map((cell) => csvCell(cell))
        .join(","),
    ),
  ];

  return { ok: true, csv: `${lines.join("\n")}\n` };
}
