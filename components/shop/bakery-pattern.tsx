import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const PATTERN_URL = "/brand/wzor-adjano-kafelek-przezroczysty.svg";

function patternStyle(size: string): { backgroundImage: string; backgroundSize: string } {
  return {
    backgroundImage: `url(${PATTERN_URL})`,
    backgroundSize: size,
  };
}

export function PatternBand({
  soft = false,
  className,
}: {
  soft?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("h-10 overflow-hidden bg-[var(--adj-cream)]", className)}>
      <div
        className={cn("h-full bg-repeat-x bg-center", soft ? "opacity-20" : "opacity-100")}
        style={patternStyle("auto 220px")}
      />
    </div>
  );
}

export function PatternFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl p-3", className)} style={patternStyle("320px auto")}>
      <div className="rounded-lg bg-background px-4 py-5">{children}</div>
    </div>
  );
}

export function PatternBackdrop({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-repeat opacity-20"
        style={patternStyle("420px auto")}
      />
      {children}
    </div>
  );
}
