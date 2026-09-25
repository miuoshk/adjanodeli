import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONE = {
  ink: "border-[var(--adj-ink-soft)] text-[var(--adj-ink-soft)]",
  red: "border-[var(--adj-red)] text-[var(--adj-red)]",
  gold: "border-transparent bg-[var(--adj-gold-light)]/40 text-[var(--adj-ink)]",
  khaki: "border-transparent bg-[var(--adj-khaki)] text-[var(--adj-cream)]",
} as const;

export type LabelTone = keyof typeof TONE;

export function LabelTag({
  tone = "ink",
  children,
}: {
  tone?: LabelTone;
  children: ReactNode;
}) {
  return (
    <span className={cn("adj-label border px-2 py-1 text-[11px] leading-none", TONE[tone])}>
      {children}
    </span>
  );
}

/** product_tags.color: red → red, khaki → khaki, reszta → gold. */
export function tagTone(color: string): LabelTone {
  if (color === "red") {
    return "red";
  }
  if (color === "khaki") {
    return "khaki";
  }
  return "gold";
}
