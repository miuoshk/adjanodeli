"use server";

import { z } from "zod";

import { getSession } from "@/lib/auth";
import { isoWeekday } from "@/lib/dates";
import { parseStandingItems } from "@/lib/standing-orders/items";
import { createServerClient } from "@/lib/supabase/server";

const nameSchema = z.string().trim().min(1).max(80);
const weekdaysSchema = z.array(z.number().int().min(1).max(7)).min(1);
const uuidSchema = z.string().uuid();

export type StandingOrderActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveStandingOrderFromPaid(input: {
  orderId: string;
  name: string;
}): Promise<StandingOrderActionResult> {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false, message: "Zaloguj się." };
  }

  const orderId = uuidSchema.safeParse(input.orderId);
  const name = nameSchema.safeParse(input.name || "Moje śniadanie");
  if (!orderId.success || !name.success) {
    return { ok: false, message: "Sprawdź nazwę." };
  }

  const supabase = await createServerClient();
  const { count } = await supabase
    .from("standing_orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  if ((count ?? 0) >= 3) {
    return { ok: false, message: "Możesz mieć max 3 stałe zamówienia." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, pickup_point_id, pickup_date, note, order_items(product_id, qty)")
    .eq("id", orderId.data)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!order || order.status !== "paid") {
    return { ok: false, message: "Zapisać można tylko opłacone zamówienie." };
  }

  const items = parseStandingItems(
    (order.order_items ?? []).flatMap((item) =>
      item.product_id ? [{ product_id: item.product_id, qty: item.qty }] : [],
    ),
  );

  if (items.length === 0) {
    return { ok: false, message: "W tym zamówieniu nie ma produktów do zapisania." };
  }

  const { error } = await supabase.from("standing_orders").insert({
    user_id: session.user.id,
    name: name.data,
    pickup_point_id: order.pickup_point_id,
    weekdays: [isoWeekday(order.pickup_date.slice(0, 10))],
    items,
    note: order.note,
    is_active: true,
    remind: true,
  });

  if (error) {
    if (error.message.includes("STANDING_ORDER_LIMIT")) {
      return { ok: false, message: "Możesz mieć max 3 stałe zamówienia." };
    }
    return { ok: false, message: "Nie udało się zapisać." };
  }

  return { ok: true };
}

export async function updateStandingOrder(input: {
  id: string;
  weekdays: number[];
  pickupPointId: string;
  isActive: boolean;
}): Promise<StandingOrderActionResult> {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false, message: "Zaloguj się." };
  }

  const id = uuidSchema.safeParse(input.id);
  const pointId = uuidSchema.safeParse(input.pickupPointId);
  const weekdays = weekdaysSchema.safeParse(input.weekdays);
  if (!id.success || !pointId.success || !weekdays.success) {
    return { ok: false, message: "Sprawdź dni i punkt." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("standing_orders")
    .update({
      weekdays: weekdays.data,
      pickup_point_id: pointId.data,
      is_active: input.isActive,
    })
    .eq("id", id.data)
    .eq("user_id", session.user.id);

  if (error) {
    return { ok: false, message: "Nie udało się zapisać." };
  }

  return { ok: true };
}
