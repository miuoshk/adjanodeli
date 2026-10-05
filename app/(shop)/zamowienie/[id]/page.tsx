import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { LabelTag } from "@/components/brand/label-tag";
import { Price } from "@/components/brand/price";
import { SectionHeading } from "@/components/brand/section-heading";
import { OrderCountdown } from "@/components/shop/order-countdown";
import { PayOrderButton } from "@/components/shop/pay-order-button";
import { PaymentCheckPoll } from "@/components/shop/payment-check-poll";
import { QrCode } from "@/components/shop/qr-code";
import { ReorderButton } from "@/components/shop/reorder-button";
import { CancelOrderButton } from "@/components/shop/cancel-order-button";
import { SaveStandingOrderButton } from "@/components/shop/save-standing-order-button";
import { getProfile, requireUser } from "@/lib/auth";
import { formatCutoff, parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice, formatTimeRange } from "@/lib/format";
import { nbsp } from "@/lib/typography";
import {
  customerCancelDeadline,
  formatCustomerCancelDeadline,
} from "@/lib/orders/cancel-deadline";
import { EXPIRED_PAID_NOTE } from "@/lib/email/send-paid-after-expiry";
import { formatItemLine, parseItemOptions } from "@/lib/orders/item-options";
import { discountKindLabel } from "@/lib/orders/volume-discount";
import { DailyReminderAsk } from "@/components/shop/daily-reminder-ask";
import { reminderPromptVisible } from "@/lib/reminders/consent";
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
    .map((item) => {
      const options = parseItemOptions(item.options);
      return {
        productId: item.product_id,
        name: item.product_name,
        unitPriceGrosze: item.unit_price_grosze,
        qty: item.qty,
        optionIds: options.map((option) => option.option_id),
        options: options.map((option) => ({
          groupName: option.group_name,
          optionName: option.option_name,
        })),
      };
    });
}

function OrderLines({
  items,
  totalGrosze,
  discountGrosze = 0,
  discountSource = null,
  discountPct = null,
}: {
  items: OrderItemRow[];
  totalGrosze: number;
  discountGrosze?: number;
  discountSource?: string | null;
  discountPct?: number | null;
}) {
  return (
    <div>
      <ul className="border-t border-[var(--adj-ink)]">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between gap-4 border-b border-[rgba(43,42,31,0.18)] py-3 text-[16px]"
          >
            <span>
              {nbsp(formatItemLine(item.qty, item.product_name, parseItemOptions(item.options)))}
            </span>
            <Price grosze={item.unit_price_grosze * item.qty} />
          </li>
        ))}
      </ul>
      {discountGrosze > 0 ? (
        <p className="mt-4 text-[16px]">
          {discountKindLabel(discountSource, discountPct)}: −{formatPrice(discountGrosze)}
        </p>
      ) : null}
      <p className="mt-4 flex items-baseline justify-between gap-4 border-t border-[rgba(43,42,31,0.18)] pt-4">
        <span className="font-heading text-xl">Suma</span>
        <span className="font-heading text-[28px] font-medium tabular-nums">
          {formatPrice(totalGrosze)}
        </span>
      </p>
    </div>
  );
}

function PointFacts({ point, pickupDate }: { point: PickupPointRow; pickupDate: string }) {
  const place = [point.address, point.description].filter(Boolean).join(", ");
  const rows = [
    ["Punkt", nbsp(point.name)],
    ["Adres", place],
    ["Dzień", formatDatePl(parseDateOnly(pickupDate))],
    ["Godziny", formatTimeRange(point.pickup_from, point.pickup_to)],
  ];

  return (
    <dl>
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[110px_1fr] gap-3 py-1.5 text-[16px]">
          <dt className="adj-ui text-[14px] text-[var(--adj-ink-soft)]">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PickupTicket({
  code,
  point,
  pickupDate,
  awaiting,
}: {
  code: string;
  point: PickupPointRow | null;
  pickupDate: string;
  awaiting?: boolean;
}) {
  return (
    <section className="adj-framed px-6 py-8 lg:px-10 lg:py-10">
      <p className="adj-label text-[var(--adj-ink-soft)]">Kod odbioru</p>
      <div className="lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
        <div>
          {awaiting ? (
            <div className="mt-3">
              <LabelTag tone="red">Do odbioru</LabelTag>
            </div>
          ) : null}
          <p
            className="mt-3 font-label text-[88px] leading-[0.9] font-extrabold tracking-[0.06em] text-[var(--adj-red)] [font-stretch:62%] lg:text-[112px]"
            aria-label={`Kod odbioru ${code}`}
          >
            {code}
          </p>
        </div>
        <div className="mt-6 w-[168px] border border-[rgba(43,42,31,0.18)] bg-white p-3 lg:mt-0">
          <QrCode value={code} />
        </div>
      </div>
      {point ? (
        <div className="mt-6 border-t border-dashed border-[rgba(43,42,31,0.3)] pt-5">
          <PointFacts point={point} pickupDate={pickupDate} />
        </div>
      ) : null}
    </section>
  );
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { id } = await params;
  const query = await searchParams;
  await requireUser(`/zamowienie/${id}`);
  const profile = await getProfile();
  const showReminderAsk = reminderPromptVisible({
    dailyReminder: profile?.daily_reminder ?? false,
    promptedAt: profile?.daily_reminder_prompted_at ?? null,
  });

  const supabase = await createServerClient();
  const [orderResult, datesResult, settingsResult, standingCountResult, latePaymentResult] =
    await Promise.all([
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
    supabase
      .from("order_events")
      .select("id")
      .eq("order_id", id)
      .eq("note", EXPIRED_PAID_NOTE)
      .limit(1),
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
  const waitingForWebhook = query.status === "success" && order.status === "pending_payment";
  const paidAfterExpiry = order.status === "expired" && (latePaymentResult.data?.length ?? 0) > 0;
  const reorderItems = toCartItems(items);

  return (
    <div className="space-y-6">
      {waitingForWebhook ? (
        <PaymentCheckPoll orderId={order.id} orderNumber={order.order_number} />
      ) : (
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
          paidAfterExpiry={paidAfterExpiry}
          showReminderAsk={showReminderAsk}
        />
      )}
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
  paidAfterExpiry,
  showReminderAsk,
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
  paidAfterExpiry: boolean;
  showReminderAsk: boolean;
}) {
  if (order.status === "pending_payment") {
    return (
      <div className="space-y-8">
        <SectionHeading as="h1" eyebrow={`Zamówienie #${order.order_number}`} title="Czeka na płatność" />
        {order.expires_at ? <OrderCountdown expiresAt={order.expires_at} /> : null}
        <PayOrderButton orderId={order.id} totalGrosze={order.total_grosze} />
        <OrderLines
          items={items}
          totalGrosze={order.total_grosze}
          discountGrosze={order.discount_grosze}
          discountSource={order.discount_source}
          discountPct={order.discount_pct}
        />
        {point ? <PointFacts point={point} pickupDate={order.pickup_date} /> : null}
      </div>
    );
  }

  if (order.status === "paid") {
    return (
      <div className="space-y-8">
        {showReminderAsk ? <DailyReminderAsk variant="card" /> : null}
        <PaidLikeView
        order={order}
        point={point}
        items={items}
        showPacking
        standingCount={standingCount}
        cancelEnabled={cancelEnabled}
        cutoffTime={cutoffTime}
        bakeryPhone={bakeryPhone}
        />
      </div>
    );
  }

  if (order.status === "in_production") {
    return (
      <PaidLikeView
        order={order}
        point={point}
        items={items}
        showPacking
      />
    );
  }

  if (order.status === "delivered") {
    const until = point ? formatCutoff(point.pickup_to) : null;
    return (
      <div className="space-y-8">
        <SectionHeading
          as="h1"
          eyebrow={`Zamówienie #${order.order_number}`}
          title="Paczka czeka na Ciebie"
          description={point && until ? `${point.name}, do ${until}.` : undefined}
        />
        {order.pickup_code ? (
          <PickupTicket
            code={order.pickup_code}
            point={point}
            pickupDate={order.pickup_date}
            awaiting
          />
        ) : null}
        <OrderLines
          items={items}
          totalGrosze={order.total_grosze}
          discountGrosze={order.discount_grosze}
          discountSource={order.discount_source}
          discountPct={order.discount_pct}
        />
      </div>
    );
  }

  if (order.status === "picked_up") {
    const when = order.picked_up_at
      ? format(new Date(order.picked_up_at), "d MMMM yyyy", { locale: pl })
      : "";
    return (
      <div className="space-y-8">
        <SectionHeading
          as="h1"
          eyebrow={`Zamówienie #${order.order_number}`}
          title={`Odebrane${when ? ` ${when}` : ""}. Smacznego!`}
        />
        <OrderLines
          items={items}
          totalGrosze={order.total_grosze}
          discountGrosze={order.discount_grosze}
          discountSource={order.discount_source}
          discountPct={order.discount_pct}
        />
        <ReorderButton firstDay={firstDay} items={reorderItems} />
      </div>
    );
  }

  if (order.status === "expired" && paidAfterExpiry) {
    const phone = bakeryPhone?.trim();
    return (
      <div className="space-y-8">
        <SectionHeading
          as="h1"
          eyebrow={`Zamówienie #${order.order_number}`}
          title="Płatność doszła po czasie. Skontaktujemy się z Tobą"
          description={phone ? `Tel. ${phone}` : "Zadzwoń do piekarni."}
        />
      </div>
    );
  }

  if (order.status === "expired") {
    return (
      <div className="space-y-8">
        <SectionHeading
          as="h1"
          eyebrow={`Zamówienie #${order.order_number}`}
          title="Zamówienie wygasło"
          description="Płatność nie dotarła na czas, więc produkty wróciły do sprzedaży."
        />
        <ReorderButton firstDay={firstDay} items={reorderItems} />
      </div>
    );
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    return (
      <div className="space-y-8">
        <SectionHeading
          as="h1"
          eyebrow={`Zamówienie #${order.order_number}`}
          title="Zamówienie anulowane"
          description={
            <>
              {order.status === "refunded"
                ? "Zwrot jest po stronie piekarni."
                : "Jeśli była płatność, zwrot zrobi piekarnia."}{" "}
              {bakeryPhone ? `Tel. ${bakeryPhone}` : "Zadzwoń do piekarni."}
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading as="h1" eyebrow={`Zamówienie #${order.order_number}`} title="Zamówienie" />
      <OrderLines
          items={items}
          totalGrosze={order.total_grosze}
          discountGrosze={order.discount_grosze}
          discountSource={order.discount_source}
          discountPct={order.discount_pct}
        />
    </div>
  );
}

function PaidLikeView({
  order,
  point,
  items,
  showPacking,
  standingCount,
  cancelEnabled,
  cutoffTime,
  bakeryPhone,
}: {
  order: OrderRow;
  point: PickupPointRow | null;
  items: OrderItemRow[];
  showPacking: boolean;
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
    <div className="space-y-8">
      <SectionHeading
        as="h1"
        eyebrow={`Zamówienie #${order.order_number}`}
        title="Opłacone. Dziękujemy!"
        description="Kod przyszedł też e‑mailem. Pokaż go przy odbiorze."
      />
      {order.pickup_code ? (
        <PickupTicket code={order.pickup_code} point={point} pickupDate={order.pickup_date} />
      ) : null}
      <OrderLines
          items={items}
          totalGrosze={order.total_grosze}
          discountGrosze={order.discount_grosze}
          discountSource={order.discount_source}
          discountPct={order.discount_pct}
        />
      {standingCount !== undefined ? (
        <SaveStandingOrderButton orderId={order.id} standingCount={standingCount} />
      ) : null}
      {cancelEnabled === undefined ? null : canCancel && deadlineLabel ? (
        <CancelOrderButton orderId={order.id} deadlineLabel={deadlineLabel} />
      ) : (
        <p className="adj-ui text-[15px] leading-relaxed text-[var(--adj-ink-soft)]">
          {deadlineLabel
            ? `Anulowanie możliwe było do ${deadlineLabel}. Zadzwoń: ${phone || "piekarnia"}.`
            : `Anulowanie jest wyłączone. Zadzwoń: ${phone || "piekarnia"}.`}
        </p>
      )}
      {showPacking ? (
        <div className="flex flex-col items-center pt-2 text-center">
          <Image
            src="/brand/logo/znak-A-karmin.svg"
            alt=""
            width={512}
            height={512}
            className="h-auto w-12"
            unoptimized
          />
          <p className="mt-3 text-[15px] text-[var(--adj-ink-soft)]">
            Przygotowujemy Twoje zamówienie.
          </p>
        </div>
      ) : null}
    </div>
  );
}
