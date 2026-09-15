"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { isoWeekday, parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice, formatTimeRange } from "@/lib/format";
import { getAvailability, type ProductAvailability } from "@/lib/orders/availability";
import { placeOrder } from "@/lib/orders/place-order";
import { selectSubtotal, useCart, type CartItem } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CartPickupPoint = {
  id: string;
  name: string;
  description: string | null;
  pickup_from: string;
  pickup_to: string;
  weekdays: number[];
};

type CartViewProps = {
  pickupDates: string[];
  pickupPoints: CartPickupPoint[];
  maxQtyPerItem: number;
  isLoggedIn: boolean;
};

function remainingFor(
  availability: Map<string, ProductAvailability>,
  productId: string,
): number | null {
  const stock = availability.get(productId);
  if (!stock) {
    return null;
  }
  if (!stock.is_available) {
    return 0;
  }
  return stock.remaining;
}

export function CartView({
  pickupDates,
  pickupPoints,
  maxQtyPerItem,
  isLoggedIn,
}: CartViewProps) {
  const [hydrated, setHydrated] = useState(false);
  const [availability, setAvailability] = useState<Map<string, ProductAvailability>>(
    new Map(),
  );
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const items = useCart((state) => state.items);
  const day = useCart((state) => state.day);
  const pickupPointId = useCart((state) => state.pickupPointId);
  const note = useCart((state) => state.note);
  const subtotal = useCart(selectSubtotal);
  const setQty = useCart((state) => state.setQty);
  const remove = useCart((state) => state.remove);
  const setDay = useCart((state) => state.setDay);
  const setPickupPoint = useCart((state) => state.setPickupPoint);
  const setNote = useCart((state) => state.setNote);
  const clear = useCart((state) => state.clear);

  useEffect(() => {
    setHydrated(useCart.persist.hasHydrated());
    return useCart.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || !day) {
      return;
    }

    let cancelled = false;

    const selectedDay = day;

    function loadAvailability(showLoading: boolean) {
      if (showLoading) {
        setAvailabilityReady(false);
      }
      getAvailability(selectedDay).then((rows) => {
        if (cancelled) {
          return;
        }
        setAvailability(new Map(rows.map((row) => [row.product_id, row])));
        setAvailabilityReady(true);
      });
    }

    loadAvailability(true);

    function onVisible() {
      if (document.visibilityState === "visible") {
        loadAvailability(false);
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated, day]);

  const dayOptions = useMemo(() => {
    const values = [...pickupDates];
    if (day && !values.includes(day)) {
      values.unshift(day);
    }
    return values;
  }, [pickupDates, day]);

  const dayExpired = Boolean(day && !pickupDates.includes(day));
  const weekday = day ? isoWeekday(day) : null;
  const selectedPoint = pickupPoints.find((point) => point.id === pickupPointId) ?? null;
  const pointServesDay =
    selectedPoint && weekday !== null ? selectedPoint.weekdays.includes(weekday) : false;

  const overstock = useMemo(() => {
    const issues = new Map<string, number>();
    if (!availabilityReady) {
      return issues;
    }
    for (const item of items) {
      const remaining = remainingFor(availability, item.productId);
      if (remaining !== null && item.qty > remaining) {
        issues.set(item.productId, remaining);
      }
    }
    return issues;
  }, [items, availability, availabilityReady]);

  const canPay =
    items.length > 0 &&
    Boolean(day) &&
    !dayExpired &&
    pointServesDay &&
    availabilityReady &&
    overstock.size === 0 &&
    termsAccepted;

  function handleDayChange(nextDay: string) {
    setDay(nextDay);
    const nextWeekday = isoWeekday(nextDay);
    const current = pickupPoints.find((point) => point.id === pickupPointId);
    if (current && !current.weekdays.includes(nextWeekday)) {
      setPickupPoint(null);
    }
  }

  function tryIncrease(item: CartItem) {
    const remaining = remainingFor(availability, item.productId) ?? 0;
    const nextQty = item.qty + 1;
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
    setQty(item.productId, nextQty);
  }

  function handlePay() {
    if (!day || !pickupPointId || !termsAccepted) {
      return;
    }

    startTransition(async () => {
      const rows = await getAvailability(day);
      const fresh = new Map(rows.map((row) => [row.product_id, row]));
      setAvailability(fresh);
      setAvailabilityReady(true);

      const stillOver = items.some((item) => {
        const remaining = remainingFor(fresh, item.productId);
        return remaining !== null && item.qty > remaining;
      });
      if (stillOver || !pickupDates.includes(day) || !pointServesDay) {
        return;
      }

      const result = await placeOrder({
        pickupPointId,
        pickupDate: day,
        items: items.map((item) => ({ productId: item.productId, qty: item.qty })),
        note,
      });

      if (result.ok) {
        clear();
        window.location.href = result.url;
        return;
      }

      if (result.code === "OUT_OF_STOCK") {
        if (result.remaining <= 0) {
          remove(result.productId);
        } else {
          setQty(result.productId, result.remaining);
        }
        const name =
          items.find((item) => item.productId === result.productId)?.name ?? "ten produkt";
        toast(
          `Ktoś był szybszy — zostało ${result.remaining} szt. ${name}. Poprawiliśmy koszyk.`,
        );
        return;
      }

      toast(result.message);
    });
  }

  if (!hydrated) {
    return <p className="text-muted-foreground">Ładowanie koszyka…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <Image
          src="/brand/janosz.png"
          alt="Janosz"
          width={220}
          height={320}
          className="h-auto w-[min(100%,220px)]"
          priority
        />
        <p className="font-heading text-2xl font-semibold">
          Koszyk jest pusty. Janosz czeka.
        </p>
        <Button asChild size="lg" className="min-h-12">
          <Link href="/">Do menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Koszyk</h1>

      {dayExpired && day ? (
        <p className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm leading-relaxed">
          Minął czas zamówień na {formatDatePl(parseDateOnly(day))}. Wybierz inny dzień.
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => {
          const remaining = overstock.get(item.productId);
          const hasIssue = remaining !== undefined;
          return (
            <li
              key={item.productId}
              className={`space-y-3 rounded-xl border bg-card p-4 ${
                hasIssue ? "border-primary ring-1 ring-primary" : "border-[var(--adj-cream-dark)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-xl font-semibold leading-tight">{item.name}</p>
                  <p className="pt-1 text-sm">
                    {formatPrice(item.unitPriceGrosze)} · {formatPrice(item.unitPriceGrosze * item.qty)}
                  </p>
                </div>
                <button
                  type="button"
                  className="min-h-12 text-sm underline-offset-4 hover:underline"
                  onClick={() => remove(item.productId)}
                >
                  Usuń
                </button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12"
                  onClick={() => setQty(item.productId, item.qty - 1)}
                  aria-label="Zmniejsz ilość"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="min-w-8 text-center text-base font-medium" aria-live="polite">
                  {item.qty}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12"
                  onClick={() => tryIncrease(item)}
                  aria-label="Zwiększ ilość"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {hasIssue ? (
                <p className="text-sm text-primary">
                  Zostało tylko {remaining} — zmniejsz ilość
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Odbiór</h2>

        <div className="space-y-2">
          <Label htmlFor="cart-day">Dzień</Label>
          <Select value={day ?? undefined} onValueChange={handleDayChange}>
            <SelectTrigger id="cart-day" className="h-12 min-h-12 w-full text-base">
              <SelectValue placeholder="Wybierz dzień" />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatDatePl(parseDateOnly(option))}
                  {pickupDates.includes(option) ? "" : " (niedostępny)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cart-point">Punkt odbioru</Label>
          <Select
            value={pickupPointId ?? undefined}
            onValueChange={setPickupPoint}
          >
            <SelectTrigger id="cart-point" className="h-12 min-h-12 w-full text-base">
              <SelectValue placeholder="Wybierz punkt" />
            </SelectTrigger>
            <SelectContent>
              {pickupPoints.map((point) => {
                const disabled = weekday !== null && !point.weekdays.includes(weekday);
                return (
                  <SelectItem key={point.id} value={point.id} disabled={disabled}>
                    {point.name}
                    {disabled ? " (nie w ten dzień)" : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedPoint && pointServesDay ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {formatTimeRange(selectedPoint.pickup_from, selectedPoint.pickup_to)}
              {selectedPoint.description ? `, ${selectedPoint.description}` : ""}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cart-note">Uwagi</Label>
          <textarea
            id="cart-note"
            value={note}
            maxLength={200}
            placeholder="np. bez cebuli"
            onChange={(event) => setNote(event.target.value)}
            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">{note.length}/200</p>
        </div>
      </section>

      <div className="space-y-3">
        <p className="text-lg font-medium">Suma: {formatPrice(subtotal)}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Płatność online: BLIK, przelew, karta. Odbiór za okazaniem kodu.
        </p>

        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-1 size-5 shrink-0"
          />
          <span>
            Akceptuję{" "}
            <a href="/regulamin" target="_blank" rel="noreferrer" className="underline underline-offset-4">
              regulamin
            </a>{" "}
            i{" "}
            <a
              href="/polityka-prywatnosci"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              politykę prywatności
            </a>
          </span>
        </label>

        {overstock.size > 0 || dayExpired ? (
          <Button type="button" size="lg" className="min-h-12 w-full text-base" disabled>
            Przejdź do płatności · {formatPrice(subtotal)}
          </Button>
        ) : isLoggedIn ? (
          <Button
            type="button"
            size="lg"
            className="min-h-12 w-full text-base"
            disabled={!canPay || isPending}
            onClick={handlePay}
          >
            Przejdź do płatności · {formatPrice(subtotal)}
          </Button>
        ) : (
          <Button asChild size="lg" className="min-h-12 w-full text-base">
            <Link href="/logowanie?next=/koszyk">
              Zaloguj się, żeby zamówić (wystarczy e-mail, bez hasła)
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
