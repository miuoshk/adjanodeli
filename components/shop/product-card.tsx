"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { productPublicUrl } from "@/lib/products/image";

import { formatDatePl, formatPrice } from "@/lib/format";
import { parseDateOnly } from "@/lib/dates";
import { useCart } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductCardProps = {
  productId: string;
  name: string;
  description: string | null;
  allergens: string[];
  unitPriceGrosze: number;
  imagePath?: string | null;
  day: string;
  remaining: number;
  isAvailable: boolean;
  maxQtyPerItem: number;
};

export function ProductCard({
  productId,
  name,
  description,
  allergens,
  unitPriceGrosze,
  imagePath,
  day,
  remaining,
  isAvailable,
  maxQtyPerItem,
}: ProductCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cartDay = useCart((state) => state.day);
  const qty = useCart((state) =>
    state.day === day
      ? (state.items.find((item) => item.productId === productId)?.qty ?? 0)
      : 0,
  );
  const add = useCart((state) => state.add);
  const setQty = useCart((state) => state.setQty);
  const clear = useCart((state) => state.clear);

  const soldOut = !isAvailable || remaining <= 0;
  const showRemaining = !soldOut && remaining <= 5;
  const imageUrl = productPublicUrl(imagePath);

  function addOne() {
    add(
      {
        productId,
        name,
        unitPriceGrosze,
        qty: 1,
      },
      day,
    );
  }

  function tryIncrease() {
    if (cartDay && cartDay !== day) {
      setConfirmOpen(true);
      return;
    }

    const nextQty = qty + 1;
    if (nextQty > maxQtyPerItem) {
      toast(
        <span>
          Większe ilości:{" "}
          <Link href="/zamowienie-specjalne" className="underline">
            zamówienie specjalne
          </Link>
        </span>,
      );
      return;
    }
    if (nextQty > remaining) {
      toast(`Na ten dzień zostało ${remaining} szt.`);
      return;
    }

    if (qty === 0) {
      addOne();
      return;
    }
    setQty(productId, nextQty);
  }

  function confirmDayChange() {
    clear();
    addOne();
    setConfirmOpen(false);
  }

  return (
    <article
      className={`flex gap-3 rounded-xl border bg-card p-4 ${soldOut ? "opacity-55" : ""}`}
    >
      {imageUrl ? (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg sm:size-28">
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 80px, 112px"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="font-heading text-xl font-semibold leading-tight">{name}</h3>
          {showRemaining ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              zostało {remaining}
            </span>
          ) : null}
        </div>
        {description ? <p className="text-sm leading-relaxed">{description}</p> : null}
        {allergens.length > 0 ? (
          <p className="text-xs text-muted-foreground">zawiera: {allergens.join(", ")}</p>
        ) : null}
        <p className="pt-1 text-base font-medium">{formatPrice(unitPriceGrosze)}</p>
      </div>

      <div className="flex shrink-0 items-start pt-0.5">
        {soldOut ? (
          <p className="max-w-24 text-right text-sm text-muted-foreground">
            wyprzedane na ten dzień
          </p>
        ) : qty === 0 ? (
          <Button type="button" className="min-h-12 min-w-20" onClick={tryIncrease}>
            Dodaj
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12"
              onClick={() => setQty(productId, qty - 1)}
              aria-label="Zmniejsz ilość"
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-8 text-center text-base font-medium" aria-live="polite">
              {qty}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12"
              onClick={tryIncrease}
              aria-label="Zwiększ ilość"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inny dzień</DialogTitle>
            <DialogDescription>
              {`Twój koszyk jest na ${formatDatePl(parseDateOnly(cartDay ?? day))}. Zmienić na ${formatDatePl(parseDateOnly(day))}? Koszyk zostanie wyczyszczony.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-12" onClick={() => setConfirmOpen(false)}>
              Anuluj
            </Button>
            <Button type="button" className="min-h-12" onClick={confirmDayChange}>
              Potwierdź
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
