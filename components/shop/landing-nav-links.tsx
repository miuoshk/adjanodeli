"use client";

import { usePathname } from "next/navigation";

const linkClass =
  "hidden min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10 lg:flex";

export function LandingNavLinks() {
  const pathname = usePathname();
  if (pathname !== "/") {
    return null;
  }

  return (
    <>
      <a href="#jak-to-dziala" className={linkClass}>
        Jak to działa
      </a>
      <a href="#punkty-odbioru" className={linkClass}>
        Punkty odbioru
      </a>
    </>
  );
}
