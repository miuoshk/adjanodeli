import Link from "next/link";

import { LabelTag, type LabelTone } from "@/components/brand/label-tag";
import { Price } from "@/components/brand/price";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatTimeRange } from "@/lib/format";
import { orderStatusMeta } from "@/lib/orders/status-labels";
import type { Tables } from "@/lib/supabase/database.types";
import { nbsp } from "@/lib/typography";

type OrderRow = Tables<"orders">;
type PickupPointRow = Tables<"pickup_points">;

export type CustomerOrder = OrderRow & {
  pickup_points: PickupPointRow | PickupPointRow[] | null;
};

export function pointOf(order: CustomerOrder): PickupPointRow | null {
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

export function OrderWaitingCard({
  order,
  label,
}: {
  order: CustomerOrder;
  label: string;
}) {
  const point = pointOf(order);
  const hours = point ? formatTimeRange(point.pickup_from, point.pickup_to) : null;

  return (
    <li className="adj-framed px-6 py-6">
      <p className="adj-label text-[var(--adj-red)]">{label}</p>
      {order.pickup_code ? (
        <p className="mt-3 font-label text-[48px] leading-none font-extrabold tracking-[0.06em] text-[var(--adj-red)] [font-stretch:62%]">
          {order.pickup_code}
        </p>
      ) : null}
      <p className="mt-3 text-[16px]">{point ? nbsp(point.name) : "Punkt odbioru"}</p>
      <p className="mt-1 text-[16px] text-[var(--adj-ink-soft)]">
        {hours
          ? `${formatDatePl(parseDateOnly(order.pickup_date))}, ${hours}`
          : formatDatePl(parseDateOnly(order.pickup_date))}
      </p>
      <Link href={`/zamowienie/${order.id}`} className="adj-link mt-4 inline-block">
        Szczegóły
      </Link>
    </li>
  );
}

export function CustomerOrderRow({ order }: { order: CustomerOrder }) {
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
