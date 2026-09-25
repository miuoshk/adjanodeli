"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

function shellClass(pathname: string): string {
  if (pathname === "/") {
    return "w-full";
  }
  if (pathname === "/sklep" || pathname.startsWith("/sklep/")) {
    return "mx-auto w-full max-w-[1280px] px-5 py-10 lg:px-12 lg:py-14";
  }
  if (pathname === "/koszyk") {
    return "mx-auto w-full max-w-[1120px] px-5 py-10 lg:px-12 lg:py-14";
  }
  return "mx-auto w-full max-w-3xl px-5 py-10 lg:py-14";
}

export function ShopMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return <main className={cn("flex-1", shellClass(pathname))}>{children}</main>;
}
