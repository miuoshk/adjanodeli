import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { PatternBackdrop, PatternFrame } from "@/components/shop/bakery-pattern";
import { OrderCountdown } from "@/components/shop/order-countdown";
import { PayOrderButton } from "@/components/shop/pay-order-button";
import { PaymentCheckPoll } from "@/components/shop/payment-check-poll";
import { QrCode } from "@/components/shop/qr-code";
import { ReorderButton } from "@/components/shop/reorder-button";
import { CancelOrderButton } from "@/components/shop/cancel-order-button";
import { SaveStandingOrderButton } from "@/components/shop/save-standing-order-button";
import { requireUser } from "@/lib/auth";
import { formatCutoff, parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice, formatTimeRange } from "@/lib/format";
import {
  customerCancelDeadline,
  formatCustomerCancelDeadline,
} from "@/lib/orders/cancel-deadline";
import { createServerClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/store/cart";
import type { Tables } from "@/lib/supabase/database.types";

type OrderPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
};

type OrderRow = Tables<"orders">;
type OrderItemRow = Tables<"order_items">;
type PickupPointRow = Tables<"pickup_points">;

function toCartItems(items: OrderItemRow[]): CartItem[] {
  return items
    .filter((item): item is OrderItemRow & { product_id: string } => Boolean(item.product_id))
    .map((item) => ({
      productId: item.product_id,
      name: item.product_name,
      unitPriceGrosze: item.unit_price_grosze,
      qty: item.qty,
    }));
}

function OrderItems({ items }: { items: OrderItemRow[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex justify-between gap-3 text-sm">
          <span>
            {item.product_name} × {item.qty}
          </span>
          <span>{formatPrice(item.unit_price_grosze * item.qty)}</span>
        </li>
      ))}
    </ul>
  );
}

function PickupBlock({
  point,
  pickupDate,
}: {
  point: PickupPointRow;
  pickupDate: string;
}) {
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      <p className="font-medium">{point.name}</p>
      <p>{point.address}</p>
      {point.description ? <p>{point.description}</p> : null}
      <p>{formatDatePl(parseDateOnly(pickupDate))}</p>
      <p>{formatTimeRange(point.pickup_from, point.pickup_to)}</p>
    </div>
  );
}

function PickupCode({ code }: { code: string }) {
  return (
    <p
      className="font-heading text-center text-[56px] leading-none font-semibold tracking-[0.28em] text-primary"
      aria-label={`Kod odbioru ${code}`}
    >
      {code}
    </p>
  );
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { id } = await params;
  const query = await searchParams;
  await requireUser(`/zamowienie/${id}`);

  const supabase = await createServerClient();
  const [orderResult, datesResult, settingsResult, standingCountResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*), pickup_points(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.rpc("available_pickup_dates"),
    supabase
      .from("settings")
      .select("owner_phone, cutoff_time, customer_cancellation_enabled")
      .eq("id", 1)
      .single(),
    supabase.from("standing_orders").select("id", { count: "exact", head: true }),
  ]);

  const order = orderResult.data as
    | (OrderRow & {
        order_items: OrderItemRow[];
        pickup_points: PickupPointRow | PickupPointRow[] | null;
      })
    | null;

  if (!order) {
    notFound();
  }

  const point = Array.isArray(order.pickup_points)
    ? (order.pickup_points[0] ?? null)
    : order.pickup_points;
  const items = order.order_items ?? [];
  const firstDay = (datesResult.data ?? []).map((value) => value.slice(0, 10))[0] ?? null;
  const bakeryPhone = settingsResult.data?.owner_phone;
  const cancelEnabled = settingsResult.data?.customer_cancellation_enabled ?? true;
  const cutoffTime = settingsResult.data?.cutoff_time ?? "20:00";
  const waitingForWebhook =
    query.status === "success" && order.status === "pending_payment";
  const reorderItems = toCartItems(items);

  return (
    <div className="space-y-6">
      {waitingForWebhook ? <PaymentCheckPoll orderId={order.id} /> : null}
      <OrderStatusView
        order={order}
        point={point}
        items={items}
        firstDay={firstDay}
        bakeryPhone={bakeryPhone}
        reorderItems={reorderItems}
        standingCount={standingCountResult.count ?? 0}
        cancelEnabled={cancelEnabled}
        cutoffTime={cutoffTime}
      />
    </div>
  );
}

function OrderStatusView({
  order,
  point,
  items,
  firstDay,
  bakeryPhone,
  reorderItems,
  standingCount,
  cancelEnabled,
  cutoffTime,
}: {
  order: OrderRow;
  point: PickupPointRow | null;
  items: OrderItemRow[];
  firstDay: string | null;
  bakeryPhone: string | null | undefined;
  reorderItems: CartItem[];
  standingCount: number;
  cancelEnabled: boolean;
  cutoffTime: string;
}) {
  if (order.status === "pending_payment") {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-semibold leading-tight">
          Zamówienie #{order.order_number} czeka na płatność
        </h1>
        {order.expires_at ? <OrderCountdown expiresAt={order.expires_at} /> : null}
        <PayOrderButton orderId={order.id} totalGrosze={order.total_grosze} />
        <OrderItems items={items} />
        {point ? <PickupBlock point={point} pickupDate={order.pickup_date} /> : null}
        <p className="text-lg font-medium">Suma: {formatPrice(order.total_grosze)}</p>
      </div>
    );
  }

  if (order.status === "paid") {
    return (
      <PaidLikeView
        heading={`Dziękujemy! Zamówienie #${order.order_number} jest opłacone.`}
        order={order}
        point={point}
        items={items}
        showJanosz
        standingCount={standingCount}
        cancelEnabled={cancelEnabled}
        cutoffTime={cutoffTime}
        bakeryPhone={bakeryPhone}
      />
    );
  }

  if (order.status === "in_production") {
    return (
      <PaidLikeView
        heading={`Dziękujemy! Zamówienie #${order.order_number} jest opłacone.`}
        order={order}
        point={point}
        items={items}
        showJanosz
      />
    );
  }

  if (order.status === "delivered") {
    return (
      <PaidLikeView
        heading={`Twoja paczka czeka w ${point?.name ?? "punkcie"} do ${point ? formatCutoff(point.pickup_to) : "—"}.`}
        order={order}
        point={point}
        items={items}
        showJanosz={false}
      />
    );
  }

  if (order.status === "picked_up") {
    const when = order.picked_up_at
      ? format(new Date(order.picked_up_at), "d MMMM yyyy", { locale: pl })
      : "";
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-semibold leading-tight">
          Odebrane{when ? ` ${when}` : ""}. Smacznego!
        </h1>
        <OrderItems items={items} />
        {point ? <p className="text-sm">{point.name}</p> : null}
        <p className="text-sm">{formatPrice(order.total_grosze)}</p>
        <ReorderButton firstDay={firstDay} items={reorderItems} />
      </div>
    );
  }

  if (order.status === "expired") {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-semibold leading-tight">
          Zamówienie wygasło — nie dotarła płatność. Produkty wróciły do puli.
        </h1>
        <ReorderButton firstDay={firstDay} items={reorderItems} />
      </div>
    );
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-semibold leading-tight">Zamówienie anulowane.</h1>
        <p className="text-base leading-relaxed">
          {order.status === "refunded"
            ? "Zwrot jest po stronie piekarni."
            : "Jeśli była płatność, zwrot zrobi piekarnia."}{" "}
          {bakeryPhone ? `Tel. ${bakeryPhone}` : "Zadzwoń do piekarni."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Zamówienie #{order.order_number}</h1>
      <OrderItems items={items} />
    </div>
  );
}

function PaidLikeView({
  heading,
  order,
  point,
  items,
  showJanosz,
  standingCount,
  cancelEnabled,
  cutoffTime,
  bakeryPhone,
}: {
  heading: string;
  order: OrderRow;
  point: PickupPointRow | null;
  items: OrderItemRow[];
  showJanosz: boolean;
  standingCount?: number;
  cancelEnabled?: boolean;
  cutoffTime?: string;
  bakeryPhone?: string | null;
}) {
  const deadlineLabel =
    cancelEnabled && cutoffTime
      ? formatCustomerCancelDeadline(order.pickup_date.slice(0, 10), cutoffTime)
      : null;
  const canCancel =
    Boolean(cancelEnabled && cutoffTime) &&
    Date.now() < customerCancelDeadline(order.pickup_date.slice(0, 10), cutoffTime ?? "20:00").getTime();
  const phone = bakeryPhone?.trim();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold leading-tight">{heading}</h1>
      {order.pickup_code ? (
        <div className="space-y-4">
          <PatternFrame>
            <PickupCode code={order.pickup_code} />
          </PatternFrame>
          <QrCode value={order.pickup_code} />
        </div>
      ) : null}
      {point ? <PickupBlock point={point} pickupDate={order.pickup_date} /> : null}
      <OrderItems items={items} />
      <p className="text-lg font-medium">Suma: {formatPrice(order.total_grosze)}</p>
      {standingCount !== undefined ? (
        <SaveStandingOrderButton orderId={order.id} standingCount={standingCount} />
      ) : null}
      {cancelEnabled === undefined ? null : canCancel && deadlineLabel ? (
        <CancelOrderButton orderId={order.id} deadlineLabel={deadlineLabel} />
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {deadlineLabel
            ? `Anulowanie możliwe było do ${deadlineLabel}. Zadzwoń: ${phone || "piekarnia"}.`
            : `Anulowanie jest wyłączone. Zadzwoń: ${phone || "piekarnia"}.`}
        </p>
      )}
      {showJanosz ? (
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <PatternBackdrop className="rounded-2xl px-6 py-4">
            <Image
              src="/brand/janosz.png"
              alt="Janosz"
              width={180}
              height={260}
              className="h-auto w-[min(100%,180px)]"
            />
          </PatternBackdrop>
          <p className="text-sm">Janosz pakuje Twoje zamówienie.</p>
        </div>
      ) : null}
    </div>
  );
}
