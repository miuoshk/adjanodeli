"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function SiteHeaderShell({
  children,
  announcement,
}: {
  children: ReactNode;
  announcement?: ReactNode;
}) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <>
        {announcement}
        <header className="sticky top-0 z-50 border-b border-[rgba(43,42,31,0.18)] bg-[var(--adj-cream)]/95 text-[var(--adj-ink)] backdrop-blur">
          <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between px-5 lg:h-[84px] lg:px-12">
            {children}
          </div>
        </header>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {children}
      </div>
      <div className="h-px bg-[var(--adj-gold)]" aria-hidden />
    </header>
  );
}
