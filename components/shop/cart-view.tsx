"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { Price } from "@/components/brand/price";
import { QtyStepper } from "@/components/brand/qty-stepper";
import { SectionHeading } from "@/components/brand/section-heading";
import { DayChips } from "@/components/shop/day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { isoWeekday, parseDateOnly, warsawDateIso } from "@/lib/dates";
import { formatDatePl, formatPrice, formatTimeRange } from "@/lib/format";
import { buildPickupCopy } from "@/lib/shop/pickup-copy";
import { nbsp } from "@/lib/typography";
import {
  computeDiscount,
  STRIPE_MIN_GROSZE,
  voucherLabel,
} from "@/lib/loyalty/discount";
import { isCompleteInvoice, type InvoiceDefaults } from "@/lib/orders/invoice";
import type { LoyaltyVoucher } from "@/lib/loyalty/status";
import { isValidNip } from "@/lib/validation/nip";
import { checkDiscountCode } from "@/lib/orders/check-discount-code";
import { getAvailability, type ProductAvailability } from "@/lib/orders/availability";
import { blockingLeadItem, cartEarliestDate } from "@/lib/orders/lead-time";
import { placeOrder } from "@/lib/orders/place-order";
import type { UnlockedPickupPoint } from "@/lib/pickup/unlock-point";
import { selectSubtotal, useCart, type CartItem } from "@/lib/store/cart";
import { UnlockPointForm } from "@/components/shop/unlock-point-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  address: string | null;
  description: string | null;
  pickup_from: string;
  pickup_to: string;
  weekdays: number[];
};

type CartViewProps = {
  pickupDates: string[];
  pickupPoints: CartPickupPoint[];
  maxQtyPerItem: number;
  cutoff: string;
  isLoggedIn: boolean;
  vouchers: LoyaltyVoucher[];
  invoiceDefaults: InvoiceDefaults | null;
};

const fieldClass =
  "min-h-24 w-full rounded-[6px] border border-[rgba(43,42,31,0.28)] bg-[var(--adj-paper-light)] px-4 py-3 text-base shadow-none outline-none placeholder:text-muted-foreground focus-visible:border-[var(--adj-khaki)] focus-visible:ring-[3px] focus-visible:ring-[var(--adj-gold)]/35";

const checkClass =
  "mt-0.5 size-5 shrink-0 rounded-[3px] border border-[var(--adj-ink)]/40 accent-[var(--adj-khaki)]";

const alertClass =
  "border-l-2 border-[var(--adj-red)] bg-[var(--adj-paper-light)] px-4 py-3 text-[15px] leading-relaxed";

function displayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return name;
  }
  return trimmed.charAt(0).toLocaleUpperCase("pl-PL") + trimmed.slice(1);
}

function voucherRank(voucher: LoyaltyVoucher): number {
  if (voucher.type === "ONE_GROSZ") {
    return 3;
  }
  if (voucher.type === "PCT50") {
    return 2;
  }
  return 1;
}

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
  cutoff,
  isLoggedIn,
  vouchers,
  invoiceDefaults,
}: CartViewProps) {
  const [hydrated, setHydrated] = useState(false);
  const [availability, setAvailability] = useState<Map<string, ProductAvailability>>(
    new Map(),
  );
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [wantInvoice, setWantInvoice] = useState(false);
  const [invoiceNip, setInvoiceNip] = useState(invoiceDefaults?.nip ?? "");
  const [invoiceCompany, setInvoiceCompany] = useState(invoiceDefaults?.company ?? "");
  const [invoiceAddress, setInvoiceAddress] = useState(invoiceDefaults?.address ?? "");
  const defaultVoucherId = [...vouchers].sort((a, b) => voucherRank(b) - voucherRank(a))[0]?.id ?? null;
  const [useVoucher, setUseVoucher] = useState(vouchers.length > 0);
  const [voucherId, setVoucherId] = useState<string | null>(defaultVoucherId);
  const [codeInput, setCodeInput] = useState("");
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<{ code: string; discountGrosze: number } | null>(null);
  const [unlockedPoints, setUnlockedPoints] = useState<CartPickupPoint[]>([]);

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

  const leadItems = useMemo(
    () =>
      items.map((item) => {
        const stock = availability.get(item.productId);
        return {
          productId: item.productId,
          name: item.name,
          leadDays: stock?.lead_days ?? 1,
          earliestDate: stock?.earliest_date ?? null,
        };
      }),
    [items, availability],
  );
  const cartEarliest = cartEarliestDate(leadItems);
  const leadBlock = blockingLeadItem(leadItems, day);

  const allowedDates = useMemo(
    () => pickupDates.filter((value) => !cartEarliest || value >= cartEarliest),
    [pickupDates, cartEarliest],
  );

  const dayOptions = useMemo(() => {
    const values = [...allowedDates];
    if (day && !values.includes(day)) {
      values.unshift(day);
    }
    return values;
  }, [allowedDates, day]);

  const dayExpired = Boolean(day && !pickupDates.includes(day));
  const weekday = day ? isoWeekday(day) : null;
  const visiblePoints = useMemo(() => {
    const map = new Map(pickupPoints.map((point) => [point.id, point]));
    for (const point of unlockedPoints) {
      if (!map.has(point.id)) {
        map.set(point.id, point);
      }
    }
    return [...map.values()];
  }, [pickupPoints, unlockedPoints]);

  const selectedPoint = visiblePoints.find((point) => point.id === pickupPointId) ?? null;
  const pointServesDay =
    selectedPoint && weekday !== null ? selectedPoint.weekdays.includes(weekday) : false;

  const selectedVoucher = vouchers.find((voucher) => voucher.id === voucherId) ?? null;
  const usingCode = Boolean(appliedCode) && !useVoucher;
  const voucherDiscount =
    useVoucher && selectedVoucher && !usingCode
      ? computeDiscount(
          selectedVoucher.type,
          items.map((item) => ({ unitPriceGrosze: item.unitPriceGrosze, qty: item.qty })),
        )
      : 0;
  const discountGrosze = usingCode ? (appliedCode?.discountGrosze ?? 0) : voucherDiscount;
  const payableGrosze = subtotal - discountGrosze;
  const belowMinimum = payableGrosze < STRIPE_MIN_GROSZE;

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

  const invoiceOk = isCompleteInvoice({
    requested: wantInvoice,
    nip: invoiceNip,
    company: invoiceCompany,
    address: invoiceAddress,
  });

  const canPay =
    items.length > 0 &&
    Boolean(day) &&
    !dayExpired &&
    !leadBlock &&
    pointServesDay &&
    availabilityReady &&
    overstock.size === 0 &&
    termsAccepted &&
    !belowMinimum &&
    invoiceOk;

  function handleDayChange(nextDay: string) {
    setDay(nextDay);
    const nextWeekday = isoWeekday(nextDay);
    const current = visiblePoints.find((point) => point.id === pickupPointId);
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

  async function applyCode() {
    setCodeChecking(true);
    setCodeMessage(null);
    try {
      const result = await checkDiscountCode({
        code: codeInput,
        subtotalGrosze: subtotal,
        pickupPointId,
      });
      if (!result.ok) {
        setAppliedCode(null);
        setCodeMessage(result.message);
        return;
      }
      setAppliedCode({ code: result.code, discountGrosze: result.discountGrosze });
      setUseVoucher(false);
      setCodeMessage(null);
    } finally {
      setCodeChecking(false);
    }
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
      const freshLead = items.map((item) => {
        const stock = fresh.get(item.productId);
        return {
          productId: item.productId,
          name: item.name,
          leadDays: stock?.lead_days ?? 1,
          earliestDate: stock?.earliest_date ?? null,
        };
      });
      if (
        stillOver ||
        !pickupDates.includes(day) ||
        !pointServesDay ||
        blockingLeadItem(freshLead, day)
      ) {
        return;
      }

      const result = await placeOrder({
        pickupPointId,
        pickupDate: day,
        items: items.map((item) => ({ productId: item.productId, qty: item.qty })),
        note,
        voucherId: useVoucher && !usingCode ? voucherId : null,
        discountCode: usingCode ? appliedCode?.code ?? null : null,
        invoice: {
          requested: wantInvoice,
          nip: invoiceNip,
          company: invoiceCompany,
          address: invoiceAddress,
        },
      });

      if (result.ok) {
        clear();
        window.location.href = result.url;
        return;
      }

      if (result.code === "LEAD_TIME") {
        const name =
          items.find((item) => item.productId === result.productId)?.name ?? "ten produkt";
        toast(
          `Masz w koszyku ${name}, który pieczemy na zamówienie. Najbliższy możliwy odbiór: ${formatDatePl(parseDateOnly(result.earliestDate))}.`,
        );
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
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 bg-[var(--adj-cream-dark)]" />
        <Skeleton className="h-16 bg-[var(--adj-cream-dark)]" />
        <Skeleton className="h-16 bg-[var(--adj-cream-dark)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Image
          src="/brand/logo/znak-A-karmin.svg"
          alt=""
          width={512}
          height={512}
          className="h-auto w-16"
          unoptimized
        />
        <p className="mt-6 font-heading text-[32px] font-medium">Koszyk jest pusty</p>
        <p className="mt-2 text-[var(--adj-ink-soft)]">Wybierz coś w&nbsp;sklepie, a&nbsp;pojawi się tutaj.</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/sklep">Przejdź do sklepu</Link>
        </Button>
      </div>
    );
  }

  const pickupCopy = day ? buildPickupCopy(day, cutoff, warsawDateIso()) : null;

  return (
    <div>
      <SectionHeading
        as="h1"
        eyebrow={pickupCopy?.longDate ? `Zamówienie na ${pickupCopy.longDate}` : "Koszyk"}
        title="Koszyk"
      />

      {dayExpired && day ? (
        <p className={`mt-8 ${alertClass}`}>
          Minął czas zamówień na {formatDatePl(parseDateOnly(day))}. Wybierz inny dzień.
        </p>
      ) : null}

      {leadBlock?.earliestDate ? (
        <div className={`mt-8 space-y-3 ${alertClass}`}>
          <p>
            Masz w koszyku {leadBlock.name}, który pieczemy na zamówienie. Najbliższy możliwy
            odbiór: {formatDatePl(parseDateOnly(leadBlock.earliestDate))}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => handleDayChange(leadBlock.earliestDate as string)}
            >
              Zmień na {formatDatePl(parseDateOnly(leadBlock.earliestDate))}
            </Button>
            <Button type="button" variant="outline" onClick={() => remove(leadBlock.productId)}>
              Usuń {leadBlock.name}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
        <div>

      <ul className="border-t border-[var(--adj-ink)]">
        {items.map((item) => {
          const remaining = overstock.get(item.productId);
          const hasIssue = remaining !== undefined;
          return (
            <li
              key={item.productId}
              className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 border-b border-[rgba(43,42,31,0.18)] py-5"
            >
              <div>
                <p className="font-heading text-[20px] leading-[1.2] font-medium lg:text-[22px]">
                  {nbsp(displayName(item.name))}
                </p>
                <p className="adj-ui text-sm text-[var(--adj-ink-soft)]">
                  <Price grosze={item.unitPriceGrosze} /> / szt.
                </p>
              </div>
              <Price grosze={item.unitPriceGrosze * item.qty} />
              <div className="flex items-center gap-3">
                <QtyStepper
                  value={item.qty}
                  label={item.name}
                  onDecrease={() => setQty(item.productId, item.qty - 1)}
                  onIncrease={() => tryIncrease(item)}
                />
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-1"
                  onClick={() => remove(item.productId)}
                >
                  Usuń
                </Button>
              </div>
              {hasIssue ? (
                <p className="col-span-2 text-sm text-[var(--adj-red)]">
                  Zostało tylko {remaining} — zmniejsz ilość
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <section className="mt-12">
        <SectionHeading as="h2" title="Odbiór" />

        <div className="mt-6 space-y-2">
          <p className="adj-label text-[var(--adj-ink-soft)]">Dzień</p>
          <DayChips dates={dayOptions} selected={day} onSelect={handleDayChange} />
        </div>

        <div className="mt-8" role="radiogroup" aria-label="Punkt odbioru">
          <div className="space-y-3">
            {visiblePoints.map((point) => {
              const disabled = weekday !== null && !point.weekdays.includes(weekday);
              const selected = point.id === pickupPointId;
              const place = [point.address, point.description].filter(Boolean).join(", ");
              return (
                <label
                  key={point.id}
                  className={`flex cursor-pointer gap-4 rounded-[4px] border bg-[var(--adj-paper-light)] px-5 py-4 ${
                    selected
                      ? "border-[var(--adj-khaki)] ring-1 ring-[var(--adj-khaki)]"
                      : "border-[rgba(43,42,31,0.22)]"
                  } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="pickup-point"
                    className="sr-only"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => setPickupPoint(point.id)}
                  />
                  <span
                    className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--adj-ink)]/40"
                    aria-hidden
                  >
                    {selected ? <span className="size-2.5 rounded-full bg-[var(--adj-khaki)]" /> : null}
                  </span>
                  <span>
                    <span className="block font-heading text-[19px] font-medium">
                      {nbsp(point.name)}
                      {disabled ? " (nie w ten dzień)" : ""}
                    </span>
                    {place ? (
                      <span className="mt-1 block text-[15px] text-[var(--adj-ink-soft)]">{place}</span>
                    ) : null}
                    <span className="adj-ui mt-1 block text-[14px]">
                      {formatTimeRange(point.pickup_from, point.pickup_to)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <Label htmlFor="employer-code">Odbierasz w pracy? Wpisz kod od pracodawcy</Label>
          <UnlockPointForm
            isLoggedIn={isLoggedIn}
            next="/koszyk"
            onUnlocked={(point: UnlockedPickupPoint) => {
              setUnlockedPoints((current) =>
                current.some((item) => item.id === point.id)
                  ? current
                  : [...current, { ...point, address: null }],
              );
              setPickupPoint(point.id);
            }}
          />
        </div>
      </section>

      <div className="mt-12 space-y-2">
        <Label htmlFor="cart-note">Uwagi do zamówienia</Label>
        <textarea
          id="cart-note"
          value={note}
          maxLength={200}
          placeholder="np. bez cebuli"
          onChange={(event) => setNote(event.target.value)}
          className={fieldClass}
        />
        <p className="adj-ui text-[13px] text-[var(--adj-ink-soft)]">{note.length}/200</p>
      </div>

      <div className="mt-12 space-y-3">
        <label className="flex items-start gap-3 text-[16px] leading-relaxed">
          <input
            type="checkbox"
            checked={wantInvoice}
            onChange={(event) => setWantInvoice(event.target.checked)}
            className={checkClass}
          />
          <span>Chcę fakturę na firmę</span>
        </label>
        {wantInvoice ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="invoice-nip">NIP</Label>
              <Input
                id="invoice-nip"
                value={invoiceNip}
                onChange={(event) => setInvoiceNip(event.target.value)}
                inputMode="numeric"
              />
              {invoiceNip.trim().length > 0 && !isValidNip(invoiceNip) ? (
                <p className="text-sm text-[var(--adj-red)]">
                  NIP ma mieć 10 cyfr i poprawną sumę kontrolną.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-company">Nazwa firmy</Label>
              <Input
                id="invoice-company"
                value={invoiceCompany}
                onChange={(event) => setInvoiceCompany(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-address">Adres</Label>
              <textarea
                id="invoice-address"
                value={invoiceAddress}
                onChange={(event) => setInvoiceAddress(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        ) : null}
      </div>
        </div>

      <aside className="adj-framed mt-12 px-6 py-7 lg:sticky lg:top-28 lg:mt-0 lg:px-8">
        <p className="adj-label text-[var(--adj-ink-soft)]">Podsumowanie</p>

        <div className="mt-5 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
              placeholder="Kod rabatowy"
              className="uppercase"
              autoCapitalize="characters"
              aria-label="Kod rabatowy"
            />
            <Button
              type="button"
              variant="outline"
              disabled={codeChecking || codeInput.trim().length === 0}
              onClick={() => void applyCode()}
            >
              {codeChecking ? "Sprawdzam…" : "Sprawdź"}
            </Button>
          </div>
          {codeMessage ? <p className="text-sm text-[var(--adj-red)]">{codeMessage}</p> : null}
          {appliedCode ? (
            <p className="text-sm leading-relaxed">
              Kod {appliedCode.code}: −{formatPrice(appliedCode.discountGrosze)}
            </p>
          ) : null}
          {appliedCode && vouchers.length > 0 && selectedVoucher ? (
            <div className="space-y-2 text-sm leading-relaxed">
              <p>Kod zastąpi Twój voucher {voucherLabel(selectedVoucher.type)}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={usingCode ? "default" : "outline"}
                  onClick={() => setUseVoucher(false)}
                >
                  Użyj kodu
                </Button>
                <Button
                  type="button"
                  variant={useVoucher ? "default" : "outline"}
                  onClick={() => setUseVoucher(true)}
                >
                  Zostaw voucher
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {vouchers.length > 0 && selectedVoucher ? (
          <div className="mt-4 space-y-2">
            <label className="flex items-start gap-3 text-[16px] leading-relaxed">
              <input
                type="checkbox"
                checked={useVoucher}
                onChange={(event) => setUseVoucher(event.target.checked)}
                className={checkClass}
              />
              <span>Użyj vouchera: {voucherLabel(selectedVoucher.type)}</span>
            </label>
            {vouchers.length > 1 ? (
              <Select
                value={voucherId ?? undefined}
                onValueChange={setVoucherId}
                disabled={!useVoucher}
              >
                <SelectTrigger className="h-12 min-h-12 w-full text-base">
                  <SelectValue placeholder="Wybierz voucher" />
                </SelectTrigger>
                <SelectContent>
                  {vouchers.map((voucher) => (
                    <SelectItem key={voucher.id} value={voucher.id}>
                      {voucherLabel(voucher.type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        ) : null}

        <div className="adj-ui mt-5 space-y-2 text-[16px]">
          <p className="flex items-baseline justify-between gap-4">
            <span>Suma</span>
            <Price grosze={subtotal} />
          </p>
          {discountGrosze > 0 ? (
            <p className="flex items-baseline justify-between gap-4">
              <span>Rabat</span>
              <span>
                −<Price grosze={discountGrosze} />
              </span>
            </p>
          ) : null}
        </div>
        <p className="mt-4 flex items-baseline justify-between gap-4 border-t border-[rgba(43,42,31,0.18)] pt-4">
          <span className="font-heading text-xl">Do zapłaty</span>
          <span className="font-heading text-[34px] font-medium tabular-nums">
            {formatPrice(payableGrosze)}
          </span>
        </p>
        {belowMinimum ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--adj-red)]">
            {discountGrosze > 0
              ? "Dodaj jeszcze produkt — po rabacie zamówienie musi mieć min. 2,00 zł."
              : "Dodaj jeszcze coś — zamówienie musi mieć min. 2,00 zł."}
          </p>
        ) : null}
        <p className="adj-ui mt-3 text-[14px] text-[var(--adj-ink-soft)]">
          Płatność online: BLIK, karta, Apple Pay albo Google Pay. Paczkę odbierasz na kod.
        </p>

        <label className="mt-5 flex items-start gap-3 text-[15px] leading-relaxed">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className={checkClass}
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

        {overstock.size > 0 || dayExpired || belowMinimum ? (
          <Button type="button" size="lg" className="mt-5 w-full" disabled>
            Przejdź do płatności · {formatPrice(payableGrosze)}
          </Button>
        ) : isLoggedIn ? (
          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            disabled={!canPay || isPending}
            onClick={handlePay}
          >
            Przejdź do płatności · {formatPrice(payableGrosze)}
          </Button>
        ) : (
          <>
            <Button asChild size="lg" className="mt-5 w-full">
              <Link href="/logowanie?next=/koszyk">Zaloguj się, żeby zamówić</Link>
            </Button>
            <p className="adj-ui mt-2 text-center text-[13px] text-[var(--adj-ink-soft)]">
              Logujesz się kodem z e‑maila.
            </p>
          </>
        )}
      </aside>
      </div>
    </div>
  );
}
