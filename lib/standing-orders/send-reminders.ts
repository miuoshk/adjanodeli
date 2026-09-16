import { sendStandingReminder } from "@/lib/email/send-standing-reminder";
import { isoWeekday } from "@/lib/dates";
import { parseStandingItems } from "@/lib/standing-orders/items";
import { isWarsawAround17 } from "@/lib/standing-orders/warsaw-window";
import { createClient } from "@/lib/supabase/admin";

const PAID_STATUSES = ["paid", "in_production", "delivered", "picked_up"] as const;

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export async function sendStandingReminders(): Promise<{
  sent: number;
  skipped: string | null;
}> {
  // Two Vercel crons (15:00 and 16:00 UTC). Summer CEST = 15:00 UTC → 17:00 Warsaw.
  // Winter CET = 16:00 UTC → 17:00 Warsaw. Only run when Warsaw is ~17:00 (±30 min).
  if (!isWarsawAround17()) {
    return { sent: 0, skipped: "outside_window" };
  }

  const admin = createClient();
  const [datesResult, settingsResult] = await Promise.all([
    admin.rpc("available_pickup_dates"),
    admin.from("settings").select("owner_phone").eq("id", 1).single(),
  ]);

  const firstDate = (datesResult.data ?? []).map((value) => value.slice(0, 10))[0] ?? null;
  if (!firstDate) {
    return { sent: 0, skipped: "no_pickup_date" };
  }

  const weekday = isoWeekday(firstDate);
  const { data: rows, error } = await admin
    .from("standing_orders")
    .select("id, user_id, name, items, profiles(email)")
    .eq("is_active", true)
    .eq("remind", true)
    .contains("weekdays", [weekday]);

  if (error) {
    throw new Error(error.message);
  }

  const productIds = [
    ...new Set(
      (rows ?? []).flatMap((row) => parseStandingItems(row.items).map((item) => item.product_id)),
    ),
  ];

  const { data: products } = productIds.length
    ? await admin.from("products").select("id, name, price_grosze").in("id", productIds)
    : { data: [] };

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const ownerPhone = settingsResult.data?.owner_phone ?? null;
  const base = appUrl();
  let sent = 0;

  for (const row of rows ?? []) {
    const { data: existing } = await admin
      .from("orders")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("pickup_date", firstDate)
      .in("status", [...PAID_STATUSES])
      .maybeSingle();

    if (existing) {
      continue;
    }

    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const email = profile?.email;
    if (!email) {
      continue;
    }

    const items = parseStandingItems(row.items).flatMap((item) => {
      const product = productById.get(item.product_id);
      if (!product) {
        return [];
      }
      return [
        {
          name: product.name,
          qty: item.qty,
          unitPriceGrosze: product.price_grosze,
        },
      ];
    });

    const result = await sendStandingReminder({
      to: email,
      standingName: row.name,
      pickupDate: firstDate,
      items,
      orderUrl: `${base}/zamow-jak-zwykle?s=${row.id}&d=${firstDate}`,
      ownerPhone,
    });

    if (result.ok) {
      sent += 1;
    }
  }

  return { sent, skipped: null };
}
