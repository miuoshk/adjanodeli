"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { productPublicUrl } from "@/lib/products/image";

import { formatDatePl, formatPrice } from "@/lib/format";
import { parseDateOnly } from "@/lib/dates";
import { useCart } from "@/lib/store/cart";
import { tagBadgeClass } from "@/lib/shop/tag-color";
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
  tags?: { name: string; color: string }[];
  unitPriceGrosze: number;
  imagePath?: string | null;
  day: string;
  remaining: number;
  isAvailable: boolean;
  isNew?: boolean;
  maxQtyPerItem: number;
  leadDays?: number;
  earliestDate?: string | null;
  regularPriceGrosze?: number;
  isPromo?: boolean;
};

export function ProductCard({
  productId,
  name,
  description,
  allergens,
  tags = [],
  unitPriceGrosze,
  imagePath,
  day,
  remaining,
  isAvailable,
  isNew = false,
  maxQtyPerItem,
  leadDays = 1,
  earliestDate = null,
  regularPriceGrosze,
  isPromo = false,
}: ProductCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leadConfirmOpen, setLeadConfirmOpen] = useState(false);
  const cartDay = useCart((state) => state.day);
  const cartItems = useCart((state) => state.items);
  const qty = useCart((state) =>
    state.day === day
      ? (state.items.find((item) => item.productId === productId)?.qty ?? 0)
      : 0,
  );
  const add = useCart((state) => state.add);
  const setQty = useCart((state) => state.setQty);
  const clear = useCart((state) => state.clear);

  const tooEarly = Boolean(earliestDate && leadDays > 1 && day < earliestDate);
  const soldOut = !tooEarly && (!isAvailable || remaining <= 0);
  const showRemaining = !soldOut && !tooEarly && remaining <= 5;
  const imageUrl = productPublicUrl(imagePath);
  const leadNote =
    leadDays > 1 && earliestDate
      ? `Na zamówienie — odbiór najwcześniej ${formatDatePl(parseDateOnly(earliestDate))}`
      : null;

  function goToEarliest() {
    if (!earliestDate) {
      return;
    }
    router.push(`${pathname}?dzien=${earliestDate}`, { scroll: false });
  }

  function requestEarliest() {
    if (!earliestDate) {
      return;
    }
    if (cartItems.length > 0 && cartDay && cartDay !== earliestDate) {
      setLeadConfirmOpen(true);
      return;
    }
    goToEarliest();
  }

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
      className={`flex gap-3 rounded-xl border bg-card p-4 ${soldOut || tooEarly ? "opacity-55" : ""}`}
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
          {isNew ? (
            <span className="rounded-full bg-[var(--adj-gold)] px-2 py-0.5 text-xs font-medium text-[var(--adj-ink)]">
              Nowość
            </span>
          ) : null}
          {isPromo ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              Promocja
            </span>
          ) : null}
          {tags.map((tag) => (
            <span
              key={tag.name}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagBadgeClass(tag.color)}`}
            >
              {tag.name}
            </span>
          ))}
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
        {isPromo && regularPriceGrosze != null && regularPriceGrosze > unitPriceGrosze ? (
          <p className="flex flex-wrap items-baseline gap-2 pt-1">
            <span className="text-base font-medium text-primary">{formatPrice(unitPriceGrosze)}</span>
            <span className="text-sm text-muted-foreground line-through">{formatPrice(regularPriceGrosze)}</span>
          </p>
        ) : (
          <p className="pt-1 text-base font-medium">{formatPrice(unitPriceGrosze)}</p>
        )}
        {leadNote ? <p className="text-sm leading-relaxed text-muted-foreground">{leadNote}</p> : null}
      </div>

      <div className="flex shrink-0 items-start pt-0.5">
        {tooEarly && earliestDate ? (
          <Button type="button" variant="outline" className="min-h-12 max-w-36 text-sm" onClick={requestEarliest}>
            Wybierz {formatDatePl(parseDateOnly(earliestDate))}
          </Button>
        ) : soldOut ? (
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

      <Dialog open={leadConfirmOpen} onOpenChange={setLeadConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inny dzień</DialogTitle>
            <DialogDescription>
              {`Twój koszyk jest na ${formatDatePl(parseDateOnly(cartDay ?? day))}. Zmienić na ${earliestDate ? formatDatePl(parseDateOnly(earliestDate)) : ""}? Koszyk zostanie wyczyszczony.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-12" onClick={() => setLeadConfirmOpen(false)}>
              Anuluj
            </Button>
            <Button
              type="button"
              className="min-h-12"
              onClick={() => {
                clear();
                setLeadConfirmOpen(false);
                goToEarliest();
              }}
            >
              Potwierdź
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
