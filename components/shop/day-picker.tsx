"use client";

import { useRouter } from "next/navigation";

import { formatDayChip } from "@/lib/dates";
import { cn } from "@/lib/utils";

type DayPickerProps = {
  dates: string[];
  selected: string;
};

export function DayPicker({ dates, selected }: DayPickerProps) {
  const router = useRouter();

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {dates.map((date) => {
        const isSelected = date === selected;
        return (
          <button
            key={date}
            type="button"
            onClick={() => router.push(`/?dzien=${date}`, { scroll: false })}
            className={cn(
              "min-h-12 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground ring-1 ring-[var(--adj-cream-dark)]",
            )}
          >
            {formatDayChip(date)}
          </button>
        );
      })}
    </div>
  );
}
