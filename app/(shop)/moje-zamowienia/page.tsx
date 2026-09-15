import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice } from "@/lib/format";
import {
  orderStatusMeta,
  STATUSES_WITH_PICKUP_CODE,
} from "@/lib/orders/status-labels";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

type OrderRow = Tables<"orders">;
type PickupPointRow = Tables<"pickup_points">;
type OrderListItem = OrderRow & {
  pickup_points: PickupPointRow | PickupPointRow[] | null;
};

function pointName(order: OrderListItem): string {
  const point = Array.isArray(order.pickup_points)
    ? (order.pickup_points[0] ?? null)
    : order.pickup_points;
  return point?.name ?? "punkt";
}

function showsCode(status: string): boolean {
  return (STATUSES_WITH_PICKUP_CODE as readonly string[]).includes(status);
}

function StatusBadge({ status }: { status: string }) {
  const meta = orderStatusMeta(status);
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ color: meta.color, borderColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function OrderCard({
  order,
  highlight,
}: {
  order: OrderListItem;
  highlight?: boolean;
}) {
  return (
    <li
      className={`rounded-xl border bg-card p-4 ${
        highlight ? "border-primary ring-1 ring-primary" : "border-[var(--adj-cream-dark)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-heading text-xl font-semibold">#{order.order_number}</p>
          <p className="text-sm">{formatDatePl(parseDateOnly(order.pickup_date))}</p>
          <p className="text-sm">{pointName(order)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{formatPrice(order.total_grosze)}</p>
          {showsCode(order.status) && order.pickup_code ? (
            <p className="pt-1 font-heading text-lg tracking-[0.18em] text-primary">
              {order.pickup_code}
            </p>
          ) : null}
        </div>
        <Link
          href={`/zamowienie/${order.id}`}
          className="min-h-12 text-sm underline-offset-4 hover:underline"
        >
          Szczegóły
        </Link>
      </div>
    </li>
  );
}

export default async function MyOrdersPage() {
  await requireUser("/moje-zamowienia");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("orders")
    .select("*, pickup_points(*)")
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as OrderListItem[];
  const waiting = orders.filter((order) => order.status === "delivered");
  const rest = orders.filter((order) => order.status !== "delivered");

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Zamówienia</h1>
        <p className="text-base leading-relaxed">Nie masz jeszcze zamówień.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Zamówienia</h1>

      {waiting.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Do odbioru</h2>
          <ul className="space-y-3">
            {waiting.map((order) => (
              <OrderCard key={order.id} order={order} highlight />
            ))}
          </ul>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="space-y-3">
          {waiting.length > 0 ? <h2 className="text-2xl font-semibold">Pozostałe</h2> : null}
          <ul className="space-y-3">
            {rest.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
