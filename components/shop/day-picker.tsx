"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useRouter } from "next/navigation";

import { formatDayChip, parseDateOnly, warsawDateIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

function stripDot(value: string): string {
  return value.replaceAll(".", "");
}

export function DayChips({
  dates,
  selected,
  onSelect,
  disabled = false,
}: {
  dates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
  disabled?: boolean;
}) {
  const tomorrow = warsawDateIso(1);

  return (
    <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
      {dates.map((date) => {
        const isSelected = date === selected;
        const parsed = parseDateOnly(date);
        return (
          <button
            key={date}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                onSelect(date);
              }
            }}
            aria-pressed={isSelected}
            aria-label={formatDayChip(date)}
            className={cn(
              "min-w-[76px] shrink-0 snap-start rounded-[6px] border px-3 py-2.5 text-center",
              disabled && "cursor-not-allowed opacity-50",
              isSelected
                ? "border-[var(--adj-khaki)] bg-[var(--adj-khaki)] text-[var(--adj-cream)]"
                : "border-[rgba(43,42,31,0.22)] bg-[var(--adj-paper-light)] hover:border-[var(--adj-ink)]",
            )}
          >
            <span className="adj-label block text-[11px]">
              {date === tomorrow ? "jutro" : stripDot(format(parsed, "EEE", { locale: pl }))}
            </span>
            <span className="mt-1 block font-heading text-[28px] leading-none font-medium tabular-nums">
              {parsed.getDate()}
            </span>
            <span className="adj-ui mt-1 block text-[13px]">
              {stripDot(format(parsed, "LLL", { locale: pl }))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type DayPickerProps = {
  dates: string[];
  selected: string;
  basePath?: string;
};

export function DayPicker({ dates, selected, basePath = "/sklep" }: DayPickerProps) {
  const router = useRouter();

  return (
    <DayChips
      dates={dates}
      selected={selected}
      onSelect={(date) => router.push(`${basePath}?dzien=${date}`, { scroll: false })}
    />
  );
}
