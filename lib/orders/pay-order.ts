"use server";

import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { itemNameWithOptions, parseItemOptions } from "@/lib/orders/item-options";
import { ORDER_MIN_GROSZE } from "@/lib/loyalty/discount";
import { stripeCouponName } from "@/lib/orders/volume-discount";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

const orderIdSchema = z.string().uuid();

export type PayOrderResult =
  | { ok: true; url: string }
  | { ok: false; code: "NOT_PAYABLE" }
  | { ok: false; code: "UNKNOWN"; message: string };

type OrderItemRow = Pick<
  Tables<"order_items">,
  "id" | "product_name" | "unit_price_grosze" | "qty" | "options"
>;

type PayableOrder = Pick<
  Tables<"orders">,
  | "id"
  | "status"
  | "expires_at"
  | "customer_email"
  | "stripe_checkout_session_id"
  | "discount_grosze"
  | "discount_source"
  | "discount_pct"
> & {
  order_items: OrderItemRow[];
  discount_codes: { code: string } | { code: string }[] | null;
};

const CHECKOUT_TTL_SECONDS = 30 * 60;

function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error("Brak NEXT_PUBLIC_APP_URL.");
  }
  return url.replace(/\/$/, "");
}

function isPayable(order: PayableOrder): boolean {
  if (order.status !== "pending_payment" || !order.expires_at) {
    return false;
  }
  return new Date(order.expires_at).getTime() > Date.now();
}

async function existingOpenUrl(sessionId: string): Promise<string | null> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.status === "open" && session.url) {
      return session.url;
    }
  } catch {
    return null;
  }
  return null;
}

export async function payOrder(orderId: string): Promise<PayOrderResult> {
  const parsedId = orderIdSchema.safeParse(orderId);
  if (!parsedId.success) {
    return { ok: false, code: "NOT_PAYABLE" };
  }

  await requireUser(`/zamowienie/${parsedId.data}`);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, expires_at, customer_email, stripe_checkout_session_id, discount_grosze, discount_source, discount_pct, order_items(id, product_name, unit_price_grosze, qty, options), discount_codes(code)",
    )
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    console.error("pay order", error.message);
    return { ok: false, code: "UNKNOWN", message: "Nie udało się otworzyć płatności." };
  }

  const order = data as PayableOrder | null;
  if (!order || !isPayable(order) || order.order_items.length === 0) {
    return { ok: false, code: "NOT_PAYABLE" };
  }

  if (order.stripe_checkout_session_id) {
    const openUrl = await existingOpenUrl(order.stripe_checkout_session_id);
    if (openUrl) {
      return { ok: true, url: openUrl };
    }
  }

  const payableGrosze =
    order.order_items.reduce((sum, item) => sum + item.unit_price_grosze * item.qty, 0) -
    order.discount_grosze;
  if (payableGrosze < ORDER_MIN_GROSZE) {
    return {
      ok: false,
      code: "UNKNOWN",
      message: `Zamówienie musi mieć min. ${formatPrice(ORDER_MIN_GROSZE)}, inaczej płatność się nie otworzy.`,
    };
  }

  try {
    const base = appUrl();
    const discounts: { coupon: string }[] = [];
    if (order.discount_grosze > 0) {
      const codeRow = Array.isArray(order.discount_codes) ? order.discount_codes[0] : order.discount_codes;
      const coupon = await getStripe().coupons.create({
        amount_off: order.discount_grosze,
        currency: "pln",
        duration: "once",
        name: stripeCouponName(order.discount_source, order.discount_pct, codeRow?.code ?? null),
      });
      discounts.push({ coupon: coupon.id });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      locale: "pl",
      currency: "pln",
      payment_method_types: ["blik", "card"],
      customer_email: order.customer_email,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SECONDS,
      success_url: `${base}/zamowienie/${order.id}?status=success`,
      cancel_url: `${base}/koszyk?cancelled=1`,
      line_items: order.order_items.map((item) => ({
        quantity: item.qty,
        price_data: {
          currency: "pln",
          unit_amount: item.unit_price_grosze,
          product_data: {
            name: itemNameWithOptions(item.product_name, parseItemOptions(item.options)),
          },
        },
      })),
      ...(discounts.length > 0 ? { discounts } : {}),
    });

    if (!session.url) {
      return { ok: false, code: "UNKNOWN", message: "Nie udało się otworzyć płatności." };
    }

    const admin = createClient();
    const { error } = await admin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    if (error) {
      return { ok: false, code: "UNKNOWN", message: "Nie udało się zapisać płatności." };
    }

    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[PAY]", order.id, error);
    return { ok: false, code: "UNKNOWN", message: "Nie udało się otworzyć płatności." };
  }
}
