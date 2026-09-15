"use client";

import { useRouter } from "next/navigation";

import { warsawDateIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

type DashboardDayPickerProps = {
  selected: string;
};

export function DashboardDayPicker({ selected }: DashboardDayPickerProps) {
  const router = useRouter();
  const today = warsawDateIso(0);
  const tomorrow = warsawDateIso(1);
  const isCustom = selected !== today && selected !== tomorrow;

  function go(day: string) {
    router.push(`/admin?dzien=${day}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => go(today)}
        className={cn(
          "min-h-12 rounded-full px-4 text-sm font-medium",
          selected === today
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground ring-1 ring-[var(--adj-cream-dark)]",
        )}
      >
        Dziś
      </button>
      <button
        type="button"
        onClick={() => go(tomorrow)}
        className={cn(
          "min-h-12 rounded-full px-4 text-sm font-medium",
          selected === tomorrow
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground ring-1 ring-[var(--adj-cream-dark)]",
        )}
      >
        Jutro
      </button>
      <label
        className={cn(
          "flex min-h-12 items-center rounded-full px-3 text-sm font-medium",
          isCustom
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground ring-1 ring-[var(--adj-cream-dark)]",
        )}
      >
        <span className="pr-2">{isCustom ? "Data" : "Wybierz datę"}</span>
        <input
          type="date"
          value={selected}
          onChange={(event) => {
            if (event.target.value) {
              go(event.target.value);
            }
          }}
          className={cn(
            "min-h-10 bg-transparent text-sm outline-none",
            isCustom ? "text-primary-foreground" : "text-foreground",
          )}
        />
      </label>
    </div>
  );
}
