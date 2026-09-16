import { NextResponse } from "next/server";

import { sendStandingReminders } from "@/lib/standing-orders/send-reminders";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");

  if (!secret || header !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await sendStandingReminders();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ sent: 0, skipped: null, error: message }, { status: 500 });
  }
}
