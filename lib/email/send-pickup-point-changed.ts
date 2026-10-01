import { recordEmailLog } from "@/lib/email/log";
import { sendEmail } from "@/lib/email/resend";
import { PickupPointChangedEmail } from "@/lib/email/templates/pickup-point-changed";
import { formatTimeRange } from "@/lib/format";
import { createClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

type OrderRow = Tables<"orders">;
type PickupPointRow = Tables<"pickup_points">;

export async function sendPickupPointChanged(
  orderId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const admin = createClient();
    const [orderResult, settingsResult] = await Promise.all([
      admin.from("orders").select("*, pickup_points(*)").eq("id", orderId).maybeSingle(),
      admin.from("settings").select("owner_phone").eq("id", 1).single(),
    ]);

    const order = orderResult.data as
      | (OrderRow & { pickup_points: PickupPointRow | PickupPointRow[] | null })
      | null;

    if (orderResult.error) {
      console.error("[EMAIL]", orderResult.error.message, orderId);
    }

    if (!order?.customer_email || !order.pickup_code) {
      const message = "Brak e-maila albo kodu odbioru.";
      console.error("[EMAIL]", message, orderId);
      await recordEmailLog({
        orderId,
        kind: "pickup_point_changed",
        recipient: order?.customer_email || "(brak adresu)",
        status: "failed",
        error: message,
      });
      return { ok: false, message };
    }

    const point = Array.isArray(order.pickup_points)
      ? (order.pickup_points[0] ?? null)
      : order.pickup_points;

    if (!point) {
      const message = "Brak punktu odbioru.";
      console.error("[EMAIL]", message, orderId);
      await recordEmailLog({
        orderId,
        kind: "pickup_point_changed",
        recipient: order.customer_email,
        status: "failed",
        error: message,
      });
      return { ok: false, message };
    }

    return sendEmail({
      to: order.customer_email,
      subject: "Zmieniliśmy punkt odbioru",
      kind: "pickup_point_changed",
      orderId: order.id,
      react: PickupPointChangedEmail({
        pointName: point.name,
        pointAddress: point.address,
        pickupHours: formatTimeRange(point.pickup_from, point.pickup_to),
        pickupCode: order.pickup_code,
        ownerPhone: settingsResult.data?.owner_phone ?? null,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się wysłać maila.";
    console.error("[EMAIL]", err);
    await recordEmailLog({
      orderId,
      kind: "pickup_point_changed",
      recipient: "(brak adresu)",
      status: "failed",
      error: message,
    });
    return { ok: false, message };
  }
}
