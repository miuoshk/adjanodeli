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
      console.error("[EMAIL]", "Brak danych do maila zwrotu ręcznego.", orderId);
      return;
    }

    await sendEmail({
      to: ownerEmail,
      subject: `Zwrot ręczny wymagany #${order.order_number}`,
      react: ManualRefundOwnerEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        total: formatPrice(order.total_grosze),
        ownerPhone: settingsResult.data?.owner_phone ?? null,
      }),
    });
  } catch (err) {
    console.error("[EMAIL]", err);
  }
}
