import { warsawDateIso } from "@/lib/dates";
import { createServerClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 365;

export type StatsRange = {
  from: string;
  to: string;
};

export type StatsSummary = {
  revenueGrosze: number;
  orderCount: number;
  avgOrderGrosze: number;
  uniqueCustomers: number;
  returningCustomers: number;
  uncollectedCount: number;
};

export type StatsRevenueDay = {
  day: string;
  revenueGrosze: number;
};

export type StatsWeekday = {
  weekday: number;
  avgOrders: number;
};

export type StatsTopProduct = {
  productId: string;
  productName: string;
  qty: number;
  revenueGrosze: number;
  selloutDays: number;
  saleDays: number;
  selloutPct: number;
};

export type StatsPointRow = {
  pickupPointId: string;
  pointName: string;
  orderCount: number;
  revenueGrosze: number;
  uncollectedCount: number;
  uncollectedPct: number;
};

export type StatsSelloutAlert = {
  productId: string;
  productName: string;
  selloutDays: number;
  currentCap: number;
  suggestedCap: number;
};

export type StatsData = {
  range: StatsRange;
  summary: StatsSummary;
  revenueByDay: StatsRevenueDay[];
  ordersByWeekday: StatsWeekday[];
  topProducts: StatsTopProduct[];
  points: StatsPointRow[];
  selloutAlerts: StatsSelloutAlert[];
};

function asNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && DATE_RE.test(value));
}

export function defaultStatsRange(): StatsRange {
  return {
    from: warsawDateIso(-29),
    to: warsawDateIso(0),
  };
}

export function resolveStatsRange(from: string | undefined, to: string | undefined): StatsRange {
  const fallback = defaultStatsRange();
  const start = isIsoDate(from) ? from : fallback.from;
  const end = isIsoDate(to) ? to : fallback.to;

  if (start > end) {
    return { from: end, to: start };
  }

  const startUtc = Date.parse(`${start}T00:00:00Z`);
  const endUtc = Date.parse(`${end}T00:00:00Z`);
  const days = Math.round((endUtc - startUtc) / 86_400_000);
  if (days > MAX_RANGE_DAYS) {
    return {
      from: new Date(endUtc - MAX_RANGE_DAYS * 86_400_000).toISOString().slice(0, 10),
      to: end,
    };
  }

  return { from: start, to: end };
}

function polishCount(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n === 1) {
    return `1 ${one}`;
  }
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) {
    return `${n} ${few}`;
  }
  return `${n} ${many}`;
}

export function selloutSuggestion(alert: StatsSelloutAlert): string {
  const times = polishCount(alert.selloutDays, "wyprzedanie", "wyprzedania", "wyprzedań");
  return `${alert.productName}: ${times} w ciągu 14 dni. Rozważ podniesienie limitu z ${alert.currentCap} do ${alert.suggestedCap}.`;
}

export async function getOwnerStats(range: StatsRange): Promise<StatsData> {
  const supabase = await createServerClient();
  const args = { p_from: range.from, p_to: range.to };

  const [summaryResult, revenueResult, weekdayResult, productsResult, pointsResult, alertsResult] =
    await Promise.all([
      supabase.rpc("stats_summary", args).maybeSingle(),
      supabase.rpc("stats_revenue_by_day", args),
      supabase.rpc("stats_orders_by_weekday", args),
      supabase.rpc("stats_top_products", args),
      supabase.rpc("stats_by_pickup_point", args),
      supabase.rpc("stats_sellout_alerts"),
    ]);

  const summary = summaryResult.data;

  return {
    range,
    summary: {
      revenueGrosze: asNumber(summary?.revenue_grosze),
      orderCount: asNumber(summary?.order_count),
      avgOrderGrosze: asNumber(summary?.avg_order_grosze),
      uniqueCustomers: asNumber(summary?.unique_customers),
      returningCustomers: asNumber(summary?.returning_customers),
      uncollectedCount: asNumber(summary?.uncollected_count),
    },
    revenueByDay: (revenueResult.data ?? []).map((row) => ({
      day: row.day,
      revenueGrosze: asNumber(row.revenue_grosze),
    })),
    ordersByWeekday: (weekdayResult.data ?? []).map((row) => ({
      weekday: asNumber(row.weekday),
      avgOrders: asNumber(row.avg_orders),
    })),
    topProducts: (productsResult.data ?? []).map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      qty: asNumber(row.qty),
      revenueGrosze: asNumber(row.revenue_grosze),
      selloutDays: asNumber(row.sellout_days),
      saleDays: asNumber(row.sale_days),
      selloutPct: asNumber(row.sellout_pct),
    })),
    points: (pointsResult.data ?? []).map((row) => ({
      pickupPointId: row.pickup_point_id,
      pointName: row.point_name,
      orderCount: asNumber(row.order_count),
      revenueGrosze: asNumber(row.revenue_grosze),
      uncollectedCount: asNumber(row.uncollected_count),
      uncollectedPct: asNumber(row.uncollected_pct),
    })),
    selloutAlerts: (alertsResult.data ?? []).map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      selloutDays: asNumber(row.sellout_days),
      currentCap: asNumber(row.current_cap),
      suggestedCap: asNumber(row.suggested_cap),
    })),
  };
}
