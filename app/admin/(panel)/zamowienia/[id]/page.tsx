import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { ChangePickupPoint } from "@/components/admin/change-pickup-point";
import { CopyInvoiceButton } from "@/components/admin/copy-invoice-button";
import { EmailLogList } from "@/components/admin/email-log-list";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderMailButtons } from "@/components/admin/order-mail-buttons";
import { PageHeader } from "@/components/admin/page-header";
import { ViewOnlyNote } from "@/components/admin/view-only-note";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminOrderDetail, getOrderEmailLog } from "@/lib/admin/queries";
import { stripePaymentUrl } from "@/lib/admin/stripe-url";
import { requireStaffPermission } from "@/lib/auth";
import { isViewOnly } from "@/lib/admin/staff-access";
import { isoWeekday, parseDateOnly } from "@/lib/dates";
import { createServerClient } from "@/lib/supabase/server";
import { EXPIRED_PAID_NOTE } from "@/lib/email/send-paid-after-expiry";
import { formatDatePl, formatPrice, formatTimeRange } from "@/lib/format";
import { formatItemLine, parseItemOptions } from "@/lib/orders/item-options";
import { discountKindLabel } from "@/lib/orders/volume-discount";
import { orderStatusMeta } from "@/lib/orders/status-labels";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireStaffPermission("orders", `/admin/zamowienia/${id}`);
  const isOwner = profile.role === "owner";
  const canManage = !isViewOnly(profile, "orders");
  const detail = await getAdminOrderDetail(id);
  const mails = await getOrderEmailLog(id);
  const supabase = await createServerClient();
  const pointsResult = await supabase
    .from("pickup_points")
    .select("id, name, address, pickup_from, pickup_to, weekdays, is_active")
    .eq("is_active", true)
    .order("sort_order");
  if (pointsResult.error) {
    console.error("pickup_points", pointsResult.error.message);
  }

  if (!detail) {
    notFound();
  }

  const { order, items, point, events } = detail;
  const stripeUrl = order.stripe_payment_intent_id
    ? stripePaymentUrl(order.stripe_payment_intent_id)
    : null;

  const paidAfterExpiry = events.some((event) => event.note === EXPIRED_PAID_NOTE);

  return (
    <div className="space-y-8">
      <PageHeader title={`Zamówienie #${order.order_number}`}>
        <StatusBadge status={order.status} />
      </PageHeader>
      <ViewOnlyNote show={!canManage} />

      {paidAfterExpiry ? (
        <p className="border border-[var(--adj-red)] bg-[var(--adj-paper-light)] px-4 py-3 text-sm leading-relaxed">
          Klient zapłacił, ale zamówienie już wygasło. Zrób zwrot w Stripe albo zadzwoń.
        </p>
      ) : null}

      <section className="space-y-2 text-sm leading-relaxed">
        <p className="text-lg font-medium">{order.customer_name}</p>
        {order.customer_phone ? <p>Tel. {order.customer_phone}</p> : null}
        <p>{order.customer_email}</p>
        {point ? (
          <>
            <p className="pt-2 font-medium">{point.name}</p>
            <p>{point.address}</p>
            <p>{formatTimeRange(point.pickup_from, point.pickup_to)}</p>
          </>
        ) : null}
        <p>{formatDatePl(parseDateOnly(order.pickup_date))}</p>
        {order.pickup_code ? (
          <p className="font-heading text-2xl tracking-[0.2em] text-primary">{order.pickup_code}</p>
        ) : null}
        {canManage && (order.status === "paid" || order.status === "in_production") ? (
          <div className="pt-3">
            <ChangePickupPoint
              orderId={order.id}
              choices={(pointsResult.data ?? [])
                .filter(
                  (candidate) =>
                    candidate.id !== order.pickup_point_id &&
                    candidate.weekdays.includes(isoWeekday(order.pickup_date)),
                )
                .map((candidate) => ({
                  id: candidate.id,
                  name: candidate.name,
                  address: candidate.address,
                  pickupFrom: candidate.pickup_from,
                  pickupTo: candidate.pickup_to,
                }))}
            />
          </div>
        ) : null}
        {order.note ? <p>Uwagi: {order.note}</p> : null}
        {order.invoice_requested ? (
          <div className="space-y-2 pt-2">
            <p className="font-medium">Faktura na firmę</p>
            {order.invoice_company ? <p>{order.invoice_company}</p> : null}
            {order.invoice_nip ? <p>NIP: {order.invoice_nip}</p> : null}
            {order.invoice_address ? <p className="whitespace-pre-wrap">{order.invoice_address}</p> : null}
            {order.invoice_company && order.invoice_nip && order.invoice_address ? (
              <CopyInvoiceButton
                company={order.invoice_company}
                nip={order.invoice_nip}
                address={order.invoice_address}
              />
            ) : null}
          </div>
        ) : null}
        {stripeUrl ? (
          <p>
            <a href={stripeUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
              Płatność w Stripe
            </a>
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Pozycje</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span>
                {formatItemLine(item.qty, item.product_name, parseItemOptions(item.options))}
              </span>
              <span>{formatPrice(item.unit_price_grosze * item.qty)}</span>
            </li>
          ))}
        </ul>
        {order.discount_grosze > 0 ? (
          <p>
            {discountKindLabel(order.discount_source, order.discount_pct)}: −
            {formatPrice(order.discount_grosze)}
          </p>
        ) : null}
        <p className="text-lg font-medium">Suma: {formatPrice(order.total_grosze)}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Maile</h2>
        <EmailLogList rows={mails} />
        {canManage ? <OrderMailButtons orderId={order.id} status={order.status} /> : null}
      </section>

      {canManage ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Akcje</h2>
          <OrderActions orderId={order.id} status={order.status} isOwner={isOwner} variant="panel" />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Historia</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak zdarzeń.</p>
        ) : (
          <ol className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3 text-sm">
                <p>
                  {format(new Date(event.createdAt), "d MMMM yyyy, HH:mm", { locale: pl })} · {event.actorName}
                </p>
                <p>
                  {event.fromStatus ? orderStatusMeta(event.fromStatus).label : "—"} →{" "}
                  {event.toStatus ? orderStatusMeta(event.toStatus).label : "—"}
                </p>
                {event.note ? <p className="text-muted-foreground">{event.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p>
        <Link href="/admin/zamowienia" className="text-sm underline-offset-4 hover:underline">
          Wróć do listy
        </Link>
      </p>
    </div>
  );
}
