import { decideEmailSend } from "@/lib/email/delivery";
import { hasSentEmail, recordEmailLog } from "@/lib/email/log";
import { sendEmail } from "@/lib/email/resend";
import { OrderDeliveredEmail } from "@/lib/email/templates/order-delivered";
import { formatCutoff } from "@/lib/dates";
import { createClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

type OrderRow = Tables<"orders">;
type PickupPointRow = Tables<"pickup_points">;

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export async function sendOrderDelivered(
  orderId: string,
  options?: { force?: boolean },
): Promise<{ ok: true; skipped?: boolean } | { ok: false; message: string }> {
  try {
    const admin = createClient();
    const [orderResult, settingsResult] = await Promise.all([
      admin.from("orders").select("*, pickup_points(*)").eq("id", orderId).maybeSingle(),
      admin.from("settings").select("owner_phone").eq("id", 1).single(),
    ]);

    const order = orderResult.data as
      | (OrderRow & { pickup_points: PickupPointRow | PickupPointRow[] | null })
      | null;

    if (!order?.customer_email || !order.pickup_code) {
      const message = "Brak e-maila albo kodu odbioru.";
      console.error("[EMAIL]", message, orderId);
      await recordEmailLog({
        orderId,
        kind: "order_delivered",
        recipient: order?.customer_email || "(brak adresu)",
        status: "failed",
        error: message,
      });
      return { ok: false, message };
    }

    if (decideEmailSend(await hasSentEmail(orderId, "order_delivered"), options?.force) === "skip") {
      await recordEmailLog({
        orderId,
        kind: "order_delivered",
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
        kind: "order_delivered",
        recipient: order.customer_email,
        status: "failed",
        error: message,
      });
      return { ok: false, message };
    }

    return sendEmail({
      to: order.customer_email,
      subject: `Twoja paczka czeka — ${point.name}, do ${formatCutoff(point.pickup_to)}`,
      kind: "order_delivered",
      orderId: order.id,
      react: OrderDeliveredEmail({
        pickupCode: order.pickup_code,
        detailsUrl: `${appUrl()}/zamowienie/${order.id}`,
        pointName: point.name,
        pointAddress: point.address,
        pickupTo: formatCutoff(point.pickup_to),
        ownerPhone: settingsResult.data?.owner_phone ?? null,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się wysłać maila.";
    console.error("[EMAIL]", err);
    await recordEmailLog({
      orderId,
      kind: "order_delivered",
      recipient: "(brak adresu)",
      status: "failed",
      error: message,
    });
    return { ok: false, message };
  }
}
