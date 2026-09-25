"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { selectTotalQty, useCart } from "@/lib/store/cart";
import { Badge } from "@/components/ui/badge";

export function HeaderCartLink() {
  const totalQty = useCart(selectTotalQty);

  return (
    <Link
      href="/koszyk"
      className="relative flex min-h-12 min-w-12 items-center justify-center rounded-md hover:bg-black/10"
      aria-label={totalQty > 0 ? `Koszyk, ${totalQty} szt.` : "Koszyk"}
    >
      <ShoppingCart className="size-6" strokeWidth={1.75} />
      {totalQty > 0 ? (
        <Badge className="adj-ui absolute -top-0.5 -right-0.5 size-5 justify-center rounded-full border-0 bg-[var(--adj-red)] px-0 text-[11px] tracking-normal text-[var(--adj-cream)] normal-case">
          {totalQty}
        </Badge>
      ) : null}
    </Link>
  );
}
