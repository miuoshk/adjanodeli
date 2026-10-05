"use server";

import { revalidatePath } from "next/cache";

import { requireRole, requireUser } from "@/lib/auth";
import { DAILY_REMINDER_CONSENT } from "@/lib/reminders/consent";
import { sendDailyReminderSample } from "@/lib/reminders/send-daily-reminders";
import { createServerClient } from "@/lib/supabase/server";

export async function setDailyReminder(enabled: boolean): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireUser("/konto");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("profiles")
    .update(
      enabled
        ? {
            daily_reminder: true,
            daily_reminder_consent_at: new Date().toISOString(),
            daily_reminder_consent_text: DAILY_REMINDER_CONSENT,
            daily_reminder_prompted_at: new Date().toISOString(),
          }
        : {
            daily_reminder: false,
            daily_reminder_prompted_at: new Date().toISOString(),
          },
    )
    .eq("id", session.user.id);

  if (error) {
    console.error("daily reminder", error.message);
    return { ok: false, message: "Nie udało się zapisać." };
  }

  revalidatePath("/");
  revalidatePath("/konto");
  revalidatePath("/sklep");
  return { ok: true };
}

export async function sendOwnerDailyReminderSample(): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireRole("owner", "/admin/ustawienia");
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("settings").select("owner_email").eq("id", 1).single();
  if (error || !data?.owner_email) {
    console.error("daily reminder sample settings", error?.message);
    return { ok: false, message: "Brak e-maila właścicielki." };
  }
  return sendDailyReminderSample(data.owner_email);
}
