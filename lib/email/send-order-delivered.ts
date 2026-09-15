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
): Promise<{ ok: true } | { ok: false }> {
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
      console.error("[EMAIL]", "Brak danych do maila order-delivered.", orderId);
      return { ok: false };
    }

    const point = Array.isArray(order.pickup_points)
      ? (order.pickup_points[0] ?? null)
      : order.pickup_points;

    if (!point) {
      console.error("[EMAIL]", "Brak punktu w mailu order-delivered.", orderId);
      return { ok: false };
    }

    return sendEmail({
      to: order.customer_email,
      subject: `Twoja paczka czeka — ${point.name}`,
      react: OrderDeliveredEmail({
        pickupCode: order.pickup_code,
        detailsUrl: `${appUrl()}/zamowienie/${order.id}`,
        pointName: point.name,
        pickupTo: formatCutoff(point.pickup_to),
        ownerPhone: settingsResult.data?.owner_phone ?? null,
      }),
    });
  } catch (err) {
    console.error("[EMAIL]", err);
    return { ok: false };
  }
}
