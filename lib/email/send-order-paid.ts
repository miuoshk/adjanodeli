import { sendEmail } from "@/lib/email/resend";
import { OrderPaidEmail } from "@/lib/email/templates/order-paid";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice, formatTimeRange } from "@/lib/format";
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

export async function sendOrderPaid(orderId: string): Promise<{ ok: true } | { ok: false }> {
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
      console.error("[EMAIL]", "Brak danych do maila order-paid.", orderId);
      return { ok: false };
    }

    const point = Array.isArray(order.pickup_points)
      ? (order.pickup_points[0] ?? null)
      : order.pickup_points;

    if (!point) {
      console.error("[EMAIL]", "Brak punktu w mailu order-paid.", orderId);
      return { ok: false };
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
      react: OrderPaidEmail({
        orderNumber: order.order_number,
        pickupCode: order.pickup_code,
        detailsUrl: `${appUrl()}/zamowienie/${order.id}`,
        pointName: point.name,
        pointAddress: point.address,
        timeRange: formatTimeRange(point.pickup_from, point.pickup_to),
        pickupDateLabel: formatDatePl(parseDateOnly(order.pickup_date)),
        items: (order.order_items ?? []).map((item) => ({
          name: item.product_name,
          qty: item.qty,
          lineTotal: formatPrice(item.unit_price_grosze * item.qty),
        })),
        total: formatPrice(order.total_grosze),
        ownerPhone: settingsResult.data?.owner_phone ?? null,
        stampsLine,
        newVoucherLine,
      }),
    });
  } catch (err) {
    console.error("[EMAIL]", err);
    return { ok: false };
  }
}
