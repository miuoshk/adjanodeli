import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");

  if (!secret || header !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const admin = createClient();
    const { data, error } = await admin.rpc("expire_pending_orders");

    if (error) {
      return NextResponse.json({ expired: 0, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expired: data ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ expired: 0, error: message }, { status: 500 });
  }
}
