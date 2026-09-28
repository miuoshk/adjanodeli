import { recordEmailLog } from "@/lib/email/log";
import { sendEmail } from "@/lib/email/resend";
import { ManualRefundOwnerEmail } from "@/lib/email/templates/manual-refund-owner";
import { formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/admin";

export async function sendManualRefundOwner(orderId: string): Promise<void> {
  try {
    const admin = createClient();
    const [orderResult, settingsResult] = await Promise.all([
      admin
        .from("orders")
        .select("order_number, customer_name, total_grosze")
        .eq("id", orderId)
        .maybeSingle(),
      admin.from("settings").select("owner_email, owner_phone").eq("id", 1).single(),
    ]);

    const order = orderResult.data;
    const ownerEmail = settingsResult.data?.owner_email;
    if (!order || !ownerEmail) {
      const message = "Brak danych do maila o zwrocie.";
      console.error("[EMAIL]", message, orderId);
      await recordEmailLog({
        orderId,
        kind: "manual_refund_owner",
        recipient: ownerEmail || "(brak adresu)",
        status: "failed",
        error: message,
      });
      return;
    }

    await sendEmail({
      to: ownerEmail,
      subject: `Zwrot ręczny wymagany #${order.order_number}`,
      kind: "manual_refund_owner",
      orderId,
      react: ManualRefundOwnerEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        total: formatPrice(order.total_grosze),
        ownerPhone: settingsResult.data?.owner_phone ?? null,
      }),
    });
  } catch (err) {
    console.error("[EMAIL]", err);
    await recordEmailLog({
      orderId,
      kind: "manual_refund_owner",
      recipient: "(brak adresu)",
      status: "failed",
      error: err instanceof Error ? err.message : "Nie udało się wysłać maila.",
    });
  }
}
