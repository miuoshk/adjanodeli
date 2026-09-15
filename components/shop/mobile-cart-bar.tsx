"use client";

import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { selectSubtotal, selectTotalQty, useCart } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";

export function MobileCartBar() {
  const totalQty = useCart(selectTotalQty);
  const subtotal = useCart(selectSubtotal);

  if (totalQty === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--adj-cream-dark)] bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p className="text-sm font-medium">
          {totalQty} szt. · {formatPrice(subtotal)}
        </p>
        <Button asChild className="min-h-12">
          <Link href="/koszyk">Do koszyka</Link>
        </Button>
      </div>
    </div>
  );
}
