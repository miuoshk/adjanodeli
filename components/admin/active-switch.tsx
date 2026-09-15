"use client";

import { cn } from "@/lib/utils";

type ActiveSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  label?: string;
};

export function ActiveSwitch({ checked, disabled, onCheckedChange, label }: ActiveSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ?? "Aktywny"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-8 w-14 rounded-full transition",
        checked ? "bg-green-700" : "bg-[var(--adj-cream-dark)]",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-1 size-6 rounded-full bg-white transition",
          checked ? "left-7" : "left-1",
        )}
      />
    </button>
  );
}
