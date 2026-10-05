import { NextResponse } from "next/server";

import { sendDailyReminders } from "@/lib/reminders/send-daily-reminders";

export const runtime = "nodejs";

// Vercel Hobby runs a cron sometime during the scheduled hour, not at the exact minute.
// The two UTC hours (16:00 and 17:00) cover summer and winter so Warsaw is 18:00–18:59.
// On Pro the cron is on the minute; a sent daily_reminder still blocks a second mail that day.
// The handler only sends when Warsaw is between 17:45 and 18:59.

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");

  if (!secret || header !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await sendDailyReminders();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("daily reminders", message);
    return NextResponse.json({ sent: 0, skipped: null, error: message }, { status: 500 });
  }
}
