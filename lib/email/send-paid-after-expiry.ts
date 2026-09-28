import { decideEmailSend } from "@/lib/email/delivery";
import { hasSentEmail, recordEmailLog } from "@/lib/email/log";
import { sendEmail } from "@/lib/email/resend";
import { PaidAfterExpiryOwnerEmail } from "@/lib/email/templates/paid-after-expiry-owner";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

type OrderRow = Tables<"orders">;
type PickupPointRow = Tables<"pickup_points">;

const EXPIRED_PAID_NOTE = "Opłacone po wygaśnięciu";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export async function recordPaidAfterExpiry(orderId: string): Promise<void> {
  const admin = createClient();
  const { data: existing } = await admin
    .from("order_events")
    .select("id")
    .eq("order_id", orderId)
    .eq("note", EXPIRED_PAID_NOTE)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return;
  }

  const { error } = await admin.from("order_events").insert({
    order_id: orderId,
    from_status: "expired",
    to_status: "expired",
    actor: null,
    note: EXPIRED_PAID_NOTE,
  });
  if (error) {
    console.error("[WEBHOOK]", "Nie udało się dopisać zdarzenia po wygaśnięciu.", orderId, error.message);
  }
}

export async function sendPaidAfterExpiryOwner(orderId: string): Promise<void> {
  try {
    const admin = createClient();
    const [orderResult, settingsResult] = await Promise.all([
      admin.from("orders").select("*, pickup_points(*)").eq("id", orderId).maybeSingle(),
      admin.from("settings").select("owner_email, owner_phone").eq("id", 1).single(),
    ]);

    const order = orderResult.data as
      | (OrderRow & { pickup_points: PickupPointRow | PickupPointRow[] | null })
      | null;
    const ownerEmail = settingsResult.data?.owner_email;
    const point = Array.isArray(order?.pickup_points)
      ? (order.pickup_points[0] ?? null)
      : (order?.pickup_points ?? null);

    if (!order || !ownerEmail) {
      const message = "Brak zamówienia albo adresu właściciela.";
      console.error("[EMAIL]", message, orderId);
      await recordEmailLog({
        orderId,
        kind: "paid_after_expiry_owner",
        recipient: ownerEmail || "(brak adresu)",
        status: "failed",
        error: message,
      });
      return;
    }

    if (decideEmailSend(await hasSentEmail(orderId, "paid_after_expiry_owner")) === "skip") {
      await recordEmailLog({
        orderId,
        kind: "paid_after_expiry_owner",
        recipient: ownerEmail,
        status: "skipped",
      });
      return;
    }

    const base = appUrl();
    await sendEmail({
      to: ownerEmail,
      subject: `Klient zapłacił za wygasłe zamówienie #${order.order_number}`,
      kind: "paid_after_expiry_owner",
      orderId,
      react: PaidAfterExpiryOwnerEmail({
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        total: formatPrice(order.total_grosze),
        pointName: point?.name ?? "Punkt nieznany",
        pickupDateLabel: formatDatePl(parseDateOnly(order.pickup_date)),
        adminUrl: `${base}/admin/zamowienia/${order.id}`,
        ownerPhone: settingsResult.data?.owner_phone ?? null,
      }),
    });
  } catch (err) {
    console.error("[EMAIL]", err);
    await recordEmailLog({
      orderId,
      kind: "paid_after_expiry_owner",
      recipient: "(brak adresu)",
      status: "failed",
      error: err instanceof Error ? err.message : "Nie udało się wysłać maila.",
    });
  }
}

export { EXPIRED_PAID_NOTE };
