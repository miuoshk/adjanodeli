import { decideEmailSend } from "@/lib/email/delivery";
import { hasSentEmail, recordEmailLog } from "@/lib/email/log";
import { sendEmail } from "@/lib/email/resend";
import { OrderPaidEmail } from "@/lib/email/templates/order-paid";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice, formatTimeRange } from "@/lib/format";
import { discountKindLabel } from "@/lib/orders/volume-discount";
import { itemNameWithOptions, parseItemOptions } from "@/lib/orders/item-options";
import { voucherLabel, type VoucherType } from "@/lib/loyalty/discount";
import { parseLoyaltyStatus } from "@/lib/loyalty/status";
import { createClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

type OrderRow = Tables<"orders">;
type OrderItemRow = Tables<"order_items">;
type PickupPointRow = Tables<"pickup_points">;

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export async function sendOrderPaid(
  orderId: string,
  options?: { force?: boolean },
): Promise<{ ok: true; skipped?: boolean } | { ok: false; message: string }> {
  try {
    const admin = createClient();
    const [orderResult, settingsResult] = await Promise.all([
      admin
        .from("orders")
        .select("*, order_items(*), pickup_points(*)")
        .eq("id", orderId)
        .maybeSingle(),
      admin.from("settings").select("owner_phone").eq("id", 1).single(),
    ]);

    const order = orderResult.data as
      | (OrderRow & {
          order_items: OrderItemRow[];
          pickup_points: PickupPointRow | PickupPointRow[] | null;
        })
      | null;

    if (!order?.customer_email || !order.pickup_code) {
      const message = "Brak e-maila albo kodu odbioru.";
      console.error("[EMAIL]", message, orderId);
      await recordEmailLog({
        orderId,
        kind: "order_paid",
        recipient: order?.customer_email || "(brak adresu)",
        status: "failed",
        error: message,
      });
      return { ok: false, message };
    }

    if (decideEmailSend(await hasSentEmail(orderId, "order_paid"), options?.force) === "skip") {
      await recordEmailLog({
        orderId,
        kind: "order_paid",
        recipient: order.customer_email,
        status: "skipped",
      });
      return { ok: true, skipped: true };
    }

    const point = Array.isArray(order.pickup_points)
      ? (order.pickup_points[0] ?? null)
      : order.pickup_points;

    if (!point) {
      const message = "Brak punktu odbioru.";
      console.error("[EMAIL]", message, orderId);
      await recordEmailLog({
        orderId,
        kind: "order_paid",
        recipient: order.customer_email,
        status: "failed",
        error: message,
      });
      return { ok: false, message };
    }

    const [statusResult, issuedResult] = await Promise.all([
      admin.rpc("loyalty_status", { p_user: order.user_id }),
      admin
        .from("loyalty_vouchers")
        .select("type")
        .eq("user_id", order.user_id)
        .gte("issued_at", order.paid_at ?? new Date(0).toISOString()),
    ]);

    const stamps = parseLoyaltyStatus(statusResult.data);
    const stampsLine = `Pieczątki: ${stamps?.active_stamps ?? 0}/10`;
    const issuedTypes = (issuedResult.data ?? [])
      .map((row) => row.type)
      .filter((type): type is VoucherType =>
        type === "PCT10" || type === "PCT50" || type === "ONE_GROSZ",
      );
    const newVoucherLine =
      issuedTypes.length > 0
        ? `Nowy voucher: ${issuedTypes.map((type) => voucherLabel(type)).join(", ")}.`
        : null;

    return sendEmail({
      to: order.customer_email,
      subject: `Zamówienie #${order.order_number} — kod odbioru ${order.pickup_code}`,
      kind: "order_paid",
      orderId: order.id,
      react: OrderPaidEmail({
        orderNumber: order.order_number,
        pickupCode: order.pickup_code,
        detailsUrl: `${appUrl()}/zamowienie/${order.id}`,
        pointName: point.name,
        pointAddress: point.address,
        timeRange: formatTimeRange(point.pickup_from, point.pickup_to),
        pickupDateLabel: formatDatePl(parseDateOnly(order.pickup_date)),
        items: (order.order_items ?? []).map((item) => ({
          name: itemNameWithOptions(item.product_name, parseItemOptions(item.options)),
          qty: item.qty,
          lineTotal: formatPrice(item.unit_price_grosze * item.qty),
        })),
        total: formatPrice(order.total_grosze),
        discountLine:
          order.discount_grosze > 0
            ? `${discountKindLabel(order.discount_source, order.discount_pct)}: −${formatPrice(order.discount_grosze)}`
            : null,
        ownerPhone: settingsResult.data?.owner_phone ?? null,
        stampsLine,
        newVoucherLine,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się wysłać potwierdzenia.";
    console.error("[EMAIL]", err);
    await recordEmailLog({
      orderId,
      kind: "order_paid",
      recipient: "(brak adresu)",
      status: "failed",
      error: message,
    });
    return { ok: false, message };
  }
}
