import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { sendOrderPaid } from "@/lib/email/send-order-paid";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function orderIdFromSession(session: Stripe.Checkout.Session): string | null {
  const fromMeta = session.metadata?.order_id;
  if (fromMeta) {
    return fromMeta;
  }
  return session.client_reference_id;
}

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const value = session.payment_intent;
  if (typeof value === "string") {
    return value;
  }
  return value?.id ?? null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!secret || !signature) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId =
    event.type === "checkout.session.completed" || event.type === "checkout.session.expired"
      ? orderIdFromSession(session)
      : null;

  console.log("[WEBHOOK]", event.type, orderId);

  if (event.type === "checkout.session.completed") {
    if (orderId) {
      try {
        const intentId = paymentIntentId(session) ?? "";
        const admin = createClient();
        const { error } = await admin.rpc("mark_order_paid", {
          p_order_id: orderId,
          p_payment_intent_id: intentId,
        });

        if (error) {
          const text = [error.message, error.details, error.hint].filter(Boolean).join(" ");
          if (text.includes("ORDER_EXPIRED")) {
            console.error("[WEBHOOK][EXPIRED_PAID]", orderId);
          } else {
            console.error("[WEBHOOK]", event.type, orderId, text);
          }
        } else {
          await sendOrderPaid(orderId);
        }
      } catch (err) {
        console.error("[WEBHOOK]", event.type, orderId, err);
      }
    }

    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.expired") {
    if (orderId) {
      try {
        const admin = createClient();
        const { error } = await admin.rpc("expire_order", { p_order_id: orderId });
        if (error) {
          console.error("[WEBHOOK]", event.type, orderId, error.message);
        }
      } catch (err) {
        console.error("[WEBHOOK]", event.type, orderId, err);
      }
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
