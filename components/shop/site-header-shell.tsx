"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { PatternBand } from "@/components/shop/bakery-pattern";
import { cn } from "@/lib/utils";

export function SiteHeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLanding) {
      setScrolled(false);
      return;
    }

    function onScroll() {
      setScrolled(window.scrollY > 16);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  return (
    <header
      className={cn(
        "z-50 text-secondary-foreground",
        isLanding ? "fixed inset-x-0 top-0" : "sticky top-0 bg-secondary",
        isLanding && (scrolled ? "bg-secondary" : "bg-transparent"),
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 items-center justify-between px-4",
          isLanding ? "max-w-5xl" : "max-w-3xl",
        )}
      >
        {children}
      </div>
      {isLanding ? null : <PatternBand />}
    </header>
  );
}
