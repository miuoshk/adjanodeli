"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { productPublicUrl } from "@/lib/products/image";
import { LabelTag, tagTone } from "@/components/brand/label-tag";
import { Price } from "@/components/brand/price";
import { QtyStepper } from "@/components/brand/qty-stepper";
import { formatDatePl } from "@/lib/format";
import { parseDateOnly } from "@/lib/dates";
import { useCart } from "@/lib/store/cart";
import { nbsp } from "@/lib/typography";
import { cn } from "@/lib/utils";
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
  const muted = soldOut || tooEarly;
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
    <article className="group flex gap-4 md:flex-col md:gap-0">
      <div className="relative size-[104px] shrink-0 overflow-hidden border-b border-[var(--adj-ink)] md:aspect-square md:size-auto">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 104px"
            className={cn(
              "adj-cutout object-contain object-bottom",
              muted && "opacity-50 grayscale",
            )}
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 md:mt-4">
        <div className="flex flex-wrap gap-1.5">
          {isNew ? <LabelTag tone="gold">Nowość</LabelTag> : null}
          {isPromo ? <LabelTag tone="red">Promocja</LabelTag> : null}
          {tags.map((tag) => (
            <LabelTag key={tag.name} tone={tagTone(tag.color)}>
              {tag.name}
            </LabelTag>
          ))}
          {showRemaining ? <LabelTag tone="red">Zostało {remaining}</LabelTag> : null}
        </div>
        <h3 className="mt-2 font-heading text-[20px] leading-[1.15] font-medium md:text-[24px]">
          {nbsp(displayName(name))}
        </h3>
        {description ? <ProductDescription text={description} /> : null}
        {allergens.length > 0 ? (
          <p className="adj-ui mt-2 text-[13px] text-[var(--adj-ink-soft)]">
            Alergeny: {allergens.map((item) => item.toLocaleLowerCase("pl")).join(", ")}
          </p>
        ) : null}
        {leadNote ? <p className="mt-2 text-sm text-[var(--adj-ink-soft)] italic">{leadNote}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Price
            grosze={unitPriceGrosze}
            regularGrosze={isPromo ? regularPriceGrosze : undefined}
          />
          {tooEarly && earliestDate ? (
            <Button
              type="button"
              variant="outline"
              className="min-w-[112px]"
              onClick={requestEarliest}
            >
              Wybierz {formatDatePl(parseDateOnly(earliestDate))}
            </Button>
          ) : soldOut ? (
            <p className="adj-ui text-right text-sm text-[var(--adj-ink-soft)]">
              Wyprzedane na ten dzień
            </p>
          ) : qty === 0 ? (
            <Button type="button" className="min-w-[112px]" onClick={tryIncrease}>
              Dodaj
            </Button>
          ) : (
            <QtyStepper
              value={qty}
              label={name}
              onDecrease={() => setQty(productId, qty - 1)}
              onIncrease={tryIncrease}
            />
          )}
        </div>
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

function displayName(name: string): string {
  if (!name) {
    return name;
  }
  return name.charAt(0).toLocaleUpperCase("pl") + name.slice(1);
}

function ProductDescription({ text }: { text: string }) {
  const [head, ...rest] = text.split("\n");
  const lines = rest.map((line) => line.trim()).filter(Boolean);

  return (
    <div className="mt-1.5 text-[15px] leading-[1.5] text-[var(--adj-ink-soft)] md:line-clamp-3">
      {head ? <p>{nbsp(head)}</p> : null}
      {lines.map((line) => (
        <p key={line} className="adj-ui text-[13px]">
          {nbsp(line)}
        </p>
      ))}
    </div>
  );
}
