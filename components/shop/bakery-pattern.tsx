import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const PATTERN_URL = "/brand/wzor-adjano-kafelek-przezroczysty.svg";

const patternImage = {
  backgroundImage: `url(${PATTERN_URL})`,
} as const;

export function PatternWash() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
      style={{ ...patternImage, opacity: 0.06 }}
    />
  );
}

export function PatternFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl p-3", className)}>
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={patternImage}
      />
      <div className="relative rounded-lg bg-background px-4 py-5">{children}</div>
    </div>
  );
}
