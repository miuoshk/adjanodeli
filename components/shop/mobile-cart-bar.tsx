"use client";

import Link from "next/link";

import { Price } from "@/components/brand/price";
import { selectSubtotal, selectTotalQty, useCart } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";

export function MobileCartBar() {
  const totalQty = useCart(selectTotalQty);
  const subtotal = useCart(selectSubtotal);

  if (totalQty === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)]/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
        <p className="adj-ui flex items-center gap-2 text-[15px]">
          <span>{totalQty} szt.</span>
          <Price grosze={subtotal} />
        </p>
        <Button asChild>
          <Link href="/koszyk">Do koszyka</Link>
        </Button>
      </div>
    </div>
  );
}
