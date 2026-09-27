import Link from "next/link";

import { LabelTag, type LabelTone } from "@/components/brand/label-tag";
import { Price } from "@/components/brand/price";
import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { formatCutoff, parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { orderStatusMeta } from "@/lib/orders/status-labels";
import { createServerClient } from "@/lib/supabase/server";
import { nbsp } from "@/lib/typography";
import type { Tables } from "@/lib/supabase/database.types";

type OrderRow = Tables<"orders">;
type PickupPointRow = Tables<"pickup_points">;
type OrderListItem = OrderRow & {
  pickup_points: PickupPointRow | PickupPointRow[] | null;
};

function pointOf(order: OrderListItem): PickupPointRow | null {
  const point = Array.isArray(order.pickup_points)
    ? (order.pickup_points[0] ?? null)
    : order.pickup_points;
  return point;
}

function statusTone(status: string): LabelTone {
  if (status === "paid" || status === "in_production") {
    return "gold";
  }
  if (status === "delivered") {
    return "red";
  }
  return "ink";
}

function WaitingCard({ order }: { order: OrderListItem }) {
  const point = pointOf(order);
  const until = point ? formatCutoff(point.pickup_to) : null;

  return (
    <li className="adj-framed px-6 py-6">
      {order.pickup_code ? (
        <p className="font-label text-[48px] leading-none font-extrabold tracking-[0.06em] text-[var(--adj-red)] [font-stretch:62%]">
          {order.pickup_code}
        </p>
      ) : null}
      <p className="mt-3 text-[16px]">
        {point ? nbsp(point.name) : "Punkt odbioru"}
        {until ? `, do ${until}` : ""}
      </p>
      <Link href={`/zamowienie/${order.id}`} className="adj-link mt-4 inline-block">
        Szczegóły
      </Link>
    </li>
  );
}

function OrderRowView({ order }: { order: OrderListItem }) {
  const point = pointOf(order);
  const meta = orderStatusMeta(order.status);

  return (
    <li className="border-b border-[rgba(43,42,31,0.18)] py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-[19px] font-medium">
            #{order.order_number}{" "}
            <span className="text-[var(--adj-ink-soft)]">
              {formatDatePl(parseDateOnly(order.pickup_date))}
            </span>
          </p>
          <p className="mt-1 text-[15px] text-[var(--adj-ink-soft)]">
            {point ? nbsp(point.name) : "Punkt odbioru"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Price grosze={order.total_grosze} />
          <LabelTag tone={statusTone(order.status)}>{meta.label}</LabelTag>
        </div>
      </div>
      <Link href={`/zamowienie/${order.id}`} className="adj-link mt-3 inline-block">
        Szczegóły
      </Link>
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

  return (
    <div>
      <SectionHeading as="h1" eyebrow="Konto" title="Zamówienia" />
      {orders.length === 0 ? (
        <div className="mt-8">
          <p className="text-[15px] text-[var(--adj-ink-soft)]">Nie masz jeszcze zamówień.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/sklep">Przejdź do sklepu</Link>
          </Button>
        </div>
      ) : (
        <>
          {waiting.length > 0 ? (
            <ul className="mt-8 space-y-4">
              {waiting.map((order) => (
                <WaitingCard key={order.id} order={order} />
              ))}
            </ul>
          ) : null}
          {rest.length > 0 ? (
            <ul className={`${waiting.length > 0 ? "mt-10" : "mt-8"} border-t border-[var(--adj-ink)]`}>
              {rest.map((order) => (
                <OrderRowView key={order.id} order={order} />
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
