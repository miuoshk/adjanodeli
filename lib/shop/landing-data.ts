import { cache } from "react";

import { formatCutoff } from "@/lib/dates";
import { formatTimeRange } from "@/lib/format";
import { formatWeekdays } from "@/lib/shop/pickup-copy";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

export type PublicPoint = {
  name: string;
  address: string;
  description: string | null;
  days: string;
  hours: string;
};

export type PickupBasics = {
  cutoff: string;
  day: string | null;
  phone: string | null;
  orderWeekdays: number[];
  publicPoints: PublicPoint[];
};

const FALLBACK: PickupBasics = {
  cutoff: "20:00",
  day: null,
  phone: null,
  orderWeekdays: [1, 2, 3, 4, 5],
  publicPoints: [],
};

/** Jedno zapytanie na żądanie. Tylko punkty publiczne — RLS pokazuje staffowi także restricted. */
export const getPickupBasics = cache(async (): Promise<PickupBasics> => {
  if (!getSupabasePublicEnv()) {
    return FALLBACK;
  }

  try {
    const supabase = await createServerClient();
    const [settingsResult, datesResult, pointsResult] = await Promise.all([
      supabase
        .from("settings")
        .select("cutoff_time, owner_phone, order_weekdays")
        .eq("id", 1)
        .maybeSingle(),
      supabase.rpc("available_pickup_dates"),
      supabase
        .from("pickup_points")
        .select("id, name, address, description, pickup_from, pickup_to, weekdays")
        .eq("is_active", true)
        .eq("visibility", "public")
        .order("sort_order"),
    ]);

    const pickupDates = (datesResult.data ?? [])
      .map((value) => (typeof value === "string" ? value.slice(0, 10) : ""))
      .filter(Boolean);
    const orderWeekdays = settingsResult.data?.order_weekdays?.length
      ? settingsResult.data.order_weekdays
      : FALLBACK.orderWeekdays;
    const openDays = new Set(orderWeekdays);
    const phone = settingsResult.data?.owner_phone?.trim() || null;

    return {
      cutoff: formatCutoff(settingsResult.data?.cutoff_time ?? "20:00"),
      day: pickupDates[0] ?? null,
      phone,
      orderWeekdays,
      publicPoints: (pointsResult.data ?? []).map((point) => ({
        name: point.name,
        address: point.address,
        description: point.description,
        days: formatWeekdays(point.weekdays.filter((weekday) => openDays.has(weekday))),
        hours: formatTimeRange(point.pickup_from, point.pickup_to),
      })),
    };
  } catch {
    return FALLBACK;
  }
});
