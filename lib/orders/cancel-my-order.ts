"use server";

import { z } from "zod";

import { getSession } from "@/lib/auth";
import { sendManualRefundOwner } from "@/lib/email/send-manual-refund-owner";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const orderIdSchema = z.string().uuid();

export type CancelMyOrderResult =
  | { ok: true; refunded: boolean; message: string }
  | { ok: false; message: string };

function parseCancelError(text: string): string {
  if (text.includes("NOT_AUTHENTICATED")) {
    return "Zaloguj się.";
  }
  if (text.includes("CANCELLATION_DISABLED") || text.includes("CANCEL_DEADLINE_PASSED")) {
    return "Tego zamówienia nie da się już anulować.";
  }
  if (text.includes("FORBIDDEN") || text.includes("ORDER_NOT_FOUND")) {
    return "Nie ma takiego zamówienia.";
  }
  if (text.includes("INVALID_TRANSITION")) {
    return "To zamówienie nie jest już w statusie do anulowania.";
  }
  return "Nie udało się anulować. Spróbuj jeszcze raz.";
}

export async function cancelMyOrder(orderId: string): Promise<CancelMyOrderResult> {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false, message: "Zaloguj się." };
  }

  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) {
    return { ok: false, message: "Nie ma takiego zamówienia." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("customer_cancel_order", { p_order_id: parsed.data });
  if (error) {
    const text = [error.message, error.details, error.hint].filter(Boolean).join(" ");
    return { ok: false, message: parseCancelError(text) };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, stripe_payment_intent_id")
    .eq("id", parsed.data)
    .maybeSingle();

  const paymentIntent = order?.stripe_payment_intent_id;
  if (!paymentIntent) {
    await sendManualRefundOwner(parsed.data);
    return {
      ok: true,
      refunded: false,
      message: "Anulowane. Zwrot pojawi się w ciągu kilku dni.",
    };
  }

  try {
    await getStripe().refunds.create({ payment_intent: paymentIntent });
    const admin = createClient();
    const { error: refundError } = await admin.rpc("mark_order_refunded", {
      p_order_id: parsed.data,
    });
    if (refundError) {
      await sendManualRefundOwner(parsed.data);
      return {
        ok: true,
        refunded: false,
        message: "Anulowane. Zwrot pojawi się w ciągu kilku dni.",
      };
    }
    return { ok: true, refunded: true, message: "Anulowane. Zwrot jest w drodze." };
  } catch {
    await sendManualRefundOwner(parsed.data);
    return {
      ok: true,
      refunded: false,
      message: "Anulowane. Zwrot pojawi się w ciągu kilku dni.",
    };
  }
}
