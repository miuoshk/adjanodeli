import { formatCutoff } from "@/lib/dates";
import { DailyReminderEmail } from "@/lib/email/templates/daily-reminder";
import { formatTimeRange } from "@/lib/format";
import { sendEmail } from "@/lib/email/resend";
import { isWarsawDailyReminderWindow } from "@/lib/reminders/warsaw-window";
import { createClient } from "@/lib/supabase/admin";

const BATCH = 50;

function warsawIso(now: Date, offsetDays = 0): string {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  if (offsetDays === 0) {
    return today;
  }
  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10);
}

type Recipient = {
  user_id: string;
  email: string;
  unsubscribe_token: string;
  point_name: string | null;
  pickup_from: string | null;
  pickup_to: string | null;
};

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

function reminderIntro(input: {
  pointName: string | null;
  hours: string | null;
  cutoff: string;
}): string {
  if (input.pointName && input.hours) {
    return `Jutro odbiór w ${input.pointName}, ${input.hours}. Zamówienia przyjmujemy do ${input.cutoff}.`;
  }
  return `Zamówienia na jutro przyjmujemy do ${input.cutoff}.`;
}

function unsubscribeHeaders(url: string, ownerEmail: string | null): Record<string, string> {
  const mailto = ownerEmail ? `, <mailto:${ownerEmail}?subject=Wypisz>` : "";
  return {
    "List-Unsubscribe": `<${url}>${mailto}`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function sendDailyReminders(now = new Date()): Promise<{
  sent: number;
  skipped: string | null;
}> {
  // Hobby cron fires on the hour, so 16:00 and 17:00 UTC land inside 17:45–18:59 Warsaw
  // in both summer and winter. The mail arrives between 18:00 and 18:59.
  // On Pro the same window still sends once, because a sent daily_reminder blocks the second run.
  if (!isWarsawDailyReminderWindow(now)) {
    return { sent: 0, skipped: "outside_window" };
  }

  const admin = createClient();
  const today = warsawIso(now);
  const tomorrow = warsawIso(now, 1);
  const [settingsResult, datesResult] = await Promise.all([
    admin
      .from("settings")
      .select("daily_reminder_enabled, cutoff_time, owner_email, owner_phone")
      .eq("id", 1)
      .single(),
    admin.rpc("available_pickup_dates"),
  ]);

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }
  if (datesResult.error) {
    throw new Error(datesResult.error.message);
  }
  if (!settingsResult.data.daily_reminder_enabled) {
    return { sent: 0, skipped: "disabled" };
  }

  const firstDate = (datesResult.data ?? []).map((value) => value.slice(0, 10))[0] ?? null;
  if (firstDate !== tomorrow) {
    return { sent: 0, skipped: "tomorrow_closed" };
  }

  const { data, error } = await admin.rpc("daily_reminder_recipients", {
    p_pickup_day: tomorrow,
    p_today: today,
  });
  if (error) {
    throw new Error(error.message);
  }

  const cutoff = formatCutoff(settingsResult.data.cutoff_time ?? "20:00");
  const ownerEmail = settingsResult.data.owner_email;
  const ownerPhone = settingsResult.data.owner_phone;
  const base = appUrl();
  const recipients = (data ?? []) as Recipient[];
  let sent = 0;

  for (const [index, recipient] of recipients.entries()) {
    const unsubscribeUrl = `${base}/przypomnienia/wypisz?t=${recipient.unsubscribe_token}`;
    const hours =
      recipient.pickup_from && recipient.pickup_to
        ? formatTimeRange(recipient.pickup_from, recipient.pickup_to)
        : null;
    const result = await sendEmail({
      to: recipient.email,
      subject: `Zamówienie na jutro przyjmujemy do ${cutoff}`,
      kind: "daily_reminder",
      headers: unsubscribeHeaders(unsubscribeUrl, ownerEmail),
      react: DailyReminderEmail({
        intro: reminderIntro({ pointName: recipient.point_name, hours, cutoff }),
        shopUrl: `${base}/sklep?src=przypomnienie`,
        unsubscribeUrl,
        ownerPhone,
      }),
    });
    if (result.ok) {
      sent += 1;
    }
    if ((index + 1) % BATCH === 0 && index + 1 < recipients.length) {
      await pause(400);
    }
  }

  return { sent, skipped: null };
}

export async function sendDailyReminderSample(to: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createClient();
  const { data, error } = await admin
    .from("settings")
    .select("cutoff_time, owner_email, owner_phone")
    .eq("id", 1)
    .single();
  if (error || !data) {
    console.error("daily reminder sample", error?.message);
    return { ok: false, message: "Nie udało się odczytać ustawień." };
  }

  const cutoff = formatCutoff(data.cutoff_time ?? "20:00");
  const base = appUrl();
  const unsubscribeUrl = `${base}/przypomnienia/wypisz?t=00000000-0000-0000-0000-000000000000`;
  return sendEmail({
    to,
    subject: `Zamówienie na jutro przyjmujemy do ${cutoff}`,
    kind: "daily_reminder",
    headers: unsubscribeHeaders(unsubscribeUrl, data.owner_email),
    react: DailyReminderEmail({
      intro: `Zamówienia na jutro przyjmujemy do ${cutoff}.`,
      shopUrl: `${base}/sklep?src=przypomnienie`,
      unsubscribeUrl,
      ownerPhone: data.owner_phone,
    }),
  });
}
