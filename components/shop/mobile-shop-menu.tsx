"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function MobileShopMenu({ hasDelivery }: { hasDelivery: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        className="flex min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Menu
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-[rgba(43,42,31,0.18)] bg-[var(--adj-cream)] p-2 shadow-sm">
          <Link
            href="/sklep"
            className="flex min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10"
          >
            Sklep
          </Link>
          <Link
            href="/moje-zamowienia"
            className="flex min-h-12 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-black/10"
          >
            Moje zamówienia
            {hasDelivery ? (
              <span
                className="size-2 shrink-0 rounded-full bg-[var(--adj-red)]"
                aria-label="Paczka czeka"
              />
            ) : null}
          </Link>
          <Link
            href="/konto"
            className="flex min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10"
          >
            Konto
          </Link>
        </div>
      ) : null}
    </div>
  );
}
