"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import {
  queryOrderByCode,
  queryOrdersFallback,
  queryReadyToPickUp,
  type HandoverReadyItem,
} from "@/lib/admin/queries";
import { sendOrderDelivered } from "@/lib/email/send-order-delivered";
import { isOrderStatus } from "@/lib/orders/status-labels";
import { createServerClient } from "@/lib/supabase/server";

const daySchema = /^\d{4}-\d{2}-\d{2}$/;

export async function startDayProduction(day: string) {
  await requireRole("staff", "/admin");

  if (!daySchema.test(day)) {
    return { ok: false as const, message: "Zły dzień." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("pickup_date", day)
    .eq("status", "paid");

  if (error) {
    return { ok: false as const, message: "Nie udało się pobrać zamówień." };
  }

  let count = 0;
  for (const order of data ?? []) {
    const { error: updateError } = await supabase.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "in_production",
      p_note: "Start produkcji dnia",
    });
    if (!updateError) {
      count += 1;
    }
  }

  revalidatePath("/admin");
  return { ok: true as const, count };
}

const CHANGEABLE_STATUSES = [
  "in_production",
  "delivered",
  "picked_up",
  "cancelled",
  "refunded",
] as const;

export async function changeOrderStatus(orderId: string, status: string, note: string) {
  await requireRole("staff", "/admin");

  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !isOrderStatus(status)) {
    return { ok: false as const, message: "Nie da się zmienić statusu." };
  }
  if (!(CHANGEABLE_STATUSES as readonly string[]).includes(status)) {
    return { ok: false as const, message: "Tego przejścia nie ma." };
  }
  if (status === "cancelled" && note.trim().length === 0) {
    return { ok: false as const, message: "Podaj powód anulowania." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("set_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_note: note.trim(),
  });

  if (error) {
    const text = [error.message, error.details, error.hint].filter(Boolean).join(" ");
    if (text.includes("FORBIDDEN")) {
      return { ok: false as const, message: "Brak uprawnień." };
    }
    if (text.includes("INVALID_TRANSITION")) {
      return { ok: false as const, message: "Tego przejścia nie ma." };
    }
    return { ok: false as const, message: "Nie udało się zmienić statusu." };
  }

  if (status === "delivered") {
    await sendOrderDelivered(orderId);
  }

  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

export async function markPointDelivered(day: string, pointId: string) {
  await requireRole("staff", "/admin");

  if (!daySchema.test(day) || !/^[0-9a-f-]{36}$/i.test(pointId)) {
    return { ok: false as const, message: "Złe dane." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, pickup_code, order_number")
    .eq("pickup_date", day)
    .eq("pickup_point_id", pointId)
    .eq("status", "in_production");

  if (error) {
    return { ok: false as const, message: "Nie udało się pobrać paczek." };
  }

  const orders = data ?? [];
  if (orders.length === 0) {
    return { ok: false as const, message: "Brak paczek w produkcji dla tego punktu." };
  }

  let delivered = 0;
  const statusErrors: string[] = [];
  const mailErrors: string[] = [];

  for (const order of orders) {
    const label = order.pickup_code ?? `#${order.order_number}`;
    const { error: updateError } = await supabase.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "delivered",
      p_note: "Dowiezione do punktu",
    });
    if (updateError) {
      statusErrors.push(label);
      continue;
    }
    delivered += 1;
    const mail = await sendOrderDelivered(order.id);
    if (!mail.ok) {
      mailErrors.push(label);
    }
  }

  revalidatePath("/admin", "layout");
  return { ok: true as const, delivered, statusErrors, mailErrors };
}

function statusErrorMessage(error: { message: string; details?: string; hint?: string }): string {
  const text = [error.message, error.details, error.hint].filter(Boolean).join(" ");
  if (text.includes("FORBIDDEN")) {
    return "Brak uprawnień.";
  }
  if (text.includes("INVALID_TRANSITION")) {
    return "Tego przejścia nie ma.";
  }
  return "Nie udało się zmienić statusu.";
}

async function applyOrderStatus(orderId: string, status: string, note: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("set_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_note: note,
  });
  if (error) {
    return { ok: false as const, message: statusErrorMessage(error) };
  }
  return { ok: true as const };
}

export async function findOrderByCode(day: string, code: string) {
  await requireRole("staff", "/admin");

  if (!daySchema.test(day) || !/^[A-Z0-9]{4}$/.test(code)) {
    return { ok: false as const, message: "Zły kod albo dzień." };
  }

  const order = await queryOrderByCode(day, code);
  return { ok: true as const, order };
}

export async function searchHandoverOrder(day: string, query: string) {
  await requireRole("staff", "/admin");

  if (!daySchema.test(day) || query.trim().length === 0) {
    return { ok: false as const, message: "Podaj numer albo nazwisko." };
  }

  const orders = await queryOrdersFallback(day, query);
  return { ok: true as const, orders };
}

export async function getReadyToPickUp(day: string, pointId: string) {
  await requireRole("staff", "/admin");

  if (!daySchema.test(day) || !/^[0-9a-f-]{36}$/i.test(pointId)) {
    return { ok: false as const, items: [] as HandoverReadyItem[] };
  }

  const items = await queryReadyToPickUp(day, pointId);
  return { ok: true as const, items };
}

export async function markOrderPickedUp(orderId: string) {
  await requireRole("staff", "/admin");

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return { ok: false as const, message: "Złe zamówienie." };
  }

  const result = await applyOrderStatus(orderId, "picked_up", "Wydano w punkcie");
  if (!result.ok) {
    return result;
  }

  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

export async function forceIssueOrder(orderId: string, status: string) {
  await requireRole("staff", "/admin");

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return { ok: false as const, message: "Złe zamówienie." };
  }

  // SPEC §5: paid → in_production → delivered → picked_up (paid → delivered jest zabronione).
  const steps =
    status === "paid"
      ? (["in_production", "delivered", "picked_up"] as const)
      : status === "in_production"
        ? (["delivered", "picked_up"] as const)
        : null;

  if (!steps) {
    return { ok: false as const, message: "Tego zamówienia nie da się wydać tak." };
  }

  for (const next of steps) {
    const result = await applyOrderStatus(orderId, next, "Wydanie z pominięciem");
    if (!result.ok) {
      return result;
    }
  }

  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

const SPECIAL_STATUSES = ["new", "contacted", "closed"] as const;

export async function changeSpecialRequestStatus(id: string, status: string) {
  await requireRole("staff", "/admin/zamowienia-specjalne");

  if (!/^[0-9a-f-]{36}$/i.test(id) || !(SPECIAL_STATUSES as readonly string[]).includes(status)) {
    return { ok: false as const, message: "Zły status." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("special_requests").update({ status }).eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się zmienić statusu." };
  }
  revalidatePath("/admin/zamowienia-specjalne");
  return { ok: true as const };
}
