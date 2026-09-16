"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { WEEKDAYS } from "@/lib/admin/catalog";
import { parseDateOnly } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import type { StatsRevenueDay, StatsWeekday } from "@/lib/admin/stats";

const KHAKI = "#4B4A2F";
const RED = "#C4161C";
const GRID = "#E6DCC6";
const INK = "#2B2A1F";

type StatsChartsProps = {
  revenueByDay: StatsRevenueDay[];
  ordersByWeekday: StatsWeekday[];
};

function shortDay(iso: string): string {
  const date = parseDateOnly(iso);
  return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function weekdayLabel(weekday: number): string {
  return WEEKDAYS.find((item) => item.value === weekday)?.label ?? String(weekday);
}

function formatAvg(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

function ChartTooltip({
  active,
  label,
  value,
  valueLabel,
}: {
  active?: boolean;
  label?: string;
  value?: string;
  valueLabel: string;
}) {
  if (!active || value === undefined) {
    return null;
  }
  return (
    <div className="rounded-md border border-[var(--adj-cream-dark)] bg-card px-3 py-2 text-sm">
      <p>{label}</p>
      <p>
        {valueLabel}: {value}
      </p>
    </div>
  );
}

export function StatsCharts({ revenueByDay, ordersByWeekday }: StatsChartsProps) {
  const revenueData = revenueByDay.map((row) => ({
    label: shortDay(row.day),
    value: row.revenueGrosze / 100,
  }));

  const weekdayData = ordersByWeekday.map((row) => ({
    label: weekdayLabel(row.weekday),
    value: row.avgOrders,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Przychód per dzień</h2>
        <div className="h-64 rounded-xl border border-[var(--adj-cream-dark)] bg-card px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: INK, fontSize: 12 }} axisLine={{ stroke: GRID }} />
              <YAxis
                tick={{ fill: INK, fontSize: 12 }}
                axisLine={{ stroke: GRID }}
                width={48}
              />
              <Tooltip
                cursor={{ fill: "rgba(75, 74, 47, 0.08)" }}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    label={typeof label === "string" ? label : undefined}
                    value={
                      payload?.[0]?.value === undefined
                        ? undefined
                        : formatPrice(Math.round(Number(payload[0].value) * 100))
                    }
                    valueLabel="Przychód"
                  />
                )}
              />
              <Bar dataKey="value" fill={KHAKI} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Zamówienia per dzień tygodnia</h2>
        <div className="h-64 rounded-xl border border-[var(--adj-cream-dark)] bg-card px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekdayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: INK, fontSize: 12 }} axisLine={{ stroke: GRID }} />
              <YAxis
                tick={{ fill: INK, fontSize: 12 }}
                axisLine={{ stroke: GRID }}
                width={36}
                allowDecimals
              />
              <Tooltip
                cursor={{ stroke: GRID }}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    label={typeof label === "string" ? label : undefined}
                    value={
                      payload?.[0]?.value === undefined
                        ? undefined
                        : formatAvg(Number(payload[0].value))
                    }
                    valueLabel="Średnia"
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={RED}
                strokeWidth={2}
                dot={{ r: 4, fill: RED, stroke: RED }}
                activeDot={{ r: 5, fill: RED }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
