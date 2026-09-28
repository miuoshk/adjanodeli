"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { sendOrderDelivered } from "@/lib/email/send-order-delivered";
import { sendOrderPaid } from "@/lib/email/send-order-paid";
import { sendEmail } from "@/lib/email/resend";
import { TestMail } from "@/lib/email/templates/test-mail";
import { createServerClient } from "@/lib/supabase/server";

const PAID_RESEND_STATUSES = ["paid", "in_production", "delivered"];

async function orderStatus(orderId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  return data?.status ?? null;
}

export async function resendOrderPaidMail(orderId: string) {
  await requireRole("staff", `/admin/zamowienia/${orderId}`);
  const status = await orderStatus(orderId);
  if (!status || !PAID_RESEND_STATUSES.includes(status)) {
    return { ok: false as const, message: "Potwierdzenie wyślemy dopiero po opłaceniu." };
  }

  const result = await sendOrderPaid(orderId, { force: true });
  revalidatePath(`/admin/zamowienia/${orderId}`);
  revalidatePath("/admin/zamowienia");
  if (!result.ok) {
    return { ok: false as const, message: result.message };
  }
  return { ok: true as const, message: "Potwierdzenie wysłane." };
}

export async function resendOrderDeliveredMail(orderId: string) {
  await requireRole("staff", `/admin/zamowienia/${orderId}`);
  const status = await orderStatus(orderId);
  if (status !== "delivered") {
    return { ok: false as const, message: "Ten mail idzie, gdy paczka już czeka." };
  }

  const result = await sendOrderDelivered(orderId, { force: true });
  revalidatePath(`/admin/zamowienia/${orderId}`);
  revalidatePath("/admin/paczki");
  revalidatePath("/admin");
  if (!result.ok) {
    return { ok: false as const, message: result.message };
  }
  return { ok: true as const, message: "Mail „paczka czeka” wysłany." };
}

export async function sendTestMail() {
  await requireRole("owner", "/admin/ustawienia");
  const supabase = await createServerClient();
  const { data } = await supabase.from("settings").select("owner_email, owner_phone").eq("id", 1).single();
  const ownerEmail = data?.owner_email;
  if (!ownerEmail) {
    return { ok: false as const, message: "Brak adresu właściciela w ustawieniach." };
  }

  const result = await sendEmail({
    to: ownerEmail,
    subject: "Test poczty Adjano Deli",
    kind: "test",
    react: TestMail({ ownerPhone: data.owner_phone }),
  });
  revalidatePath("/admin/ustawienia");
  if (!result.ok) {
    return { ok: false as const, message: result.message };
  }
  return { ok: true as const, message: `Test wysłany na ${ownerEmail}.` };
}
