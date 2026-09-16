"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function ShopMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <main
      className={cn(
        "flex-1",
        isLanding ? "w-full" : "mx-auto w-full max-w-3xl px-4 py-6",
      )}
    >
      {children}
    </main>
  );
}
