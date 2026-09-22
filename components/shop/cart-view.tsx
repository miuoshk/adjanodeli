"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { isoWeekday, parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice, formatTimeRange } from "@/lib/format";
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
import { PatternBackdrop } from "@/components/shop/bakery-pattern";
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
  vouchers: LoyaltyVoucher[];
  invoiceDefaults: InvoiceDefaults | null;
};

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
  const [codeOpen, setCodeOpen] = useState(false);
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
  const belowMinimum = useVoucher && discountGrosze > 0 && payableGrosze < STRIPE_MIN_GROSZE;

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
    return <p className="text-muted-foreground">Ładowanie koszyka…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <PatternBackdrop className="rounded-2xl px-6 py-4">
          <Image
            src="/brand/janosz.png"
            alt="Janosz"
            width={220}
            height={320}
            className="h-auto w-[min(100%,220px)]"
            priority
          />
        </PatternBackdrop>
        <p className="font-heading text-2xl font-semibold">
          Koszyk jest pusty. Janosz czeka.
        </p>
        <Button asChild size="lg" className="min-h-12">
          <Link href="/sklep">Do menu</Link>
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

      {leadBlock?.earliestDate ? (
        <div className="space-y-3 rounded-xl border border-primary bg-primary/10 px-4 py-3">
          <p className="text-sm leading-relaxed">
            Masz w koszyku {leadBlock.name}, który pieczemy na zamówienie. Najbliższy możliwy
            odbiór: {formatDatePl(parseDateOnly(leadBlock.earliestDate))}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="min-h-12"
              onClick={() => handleDayChange(leadBlock.earliestDate as string)}
            >
              Zmień na {formatDatePl(parseDateOnly(leadBlock.earliestDate))}
            </Button>
            <Button type="button" variant="outline" className="min-h-12" onClick={() => remove(leadBlock.productId)}>
              Usuń {leadBlock.name}
            </Button>
          </div>
        </div>
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
              {visiblePoints.map((point) => {
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

        <div className="space-y-2 pt-1">
          <p className="text-sm text-muted-foreground">Odbierasz w pracy? Wpisz kod od pracodawcy</p>
          <UnlockPointForm
            isLoggedIn={isLoggedIn}
            next="/koszyk"
            onUnlocked={(point: UnlockedPickupPoint) => {
              setUnlockedPoints((current) =>
                current.some((item) => item.id === point.id) ? current : [...current, point],
              );
              setPickupPoint(point.id);
            }}
          />
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

        <div className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3">
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={wantInvoice}
              onChange={(event) => setWantInvoice(event.target.checked)}
              className="mt-1 size-5 shrink-0"
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
                  className="h-12 min-h-12 text-base"
                />
                {invoiceNip.trim().length > 0 && !isValidNip(invoiceNip) ? (
                  <p className="text-sm text-primary">NIP ma mieć 10 cyfr i poprawną sumę kontrolną.</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-company">Nazwa firmy</Label>
                <Input
                  id="invoice-company"
                  value={invoiceCompany}
                  onChange={(event) => setInvoiceCompany(event.target.value)}
                  className="h-12 min-h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-address">Adres</Label>
                <textarea
                  id="invoice-address"
                  value={invoiceAddress}
                  onChange={(event) => setInvoiceAddress(event.target.value)}
                  className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3">
          <button
            type="button"
            className="min-h-12 text-left text-sm underline-offset-4 hover:underline"
            onClick={() => setCodeOpen((open) => !open)}
          >
            Masz kod rabatowy?
          </button>
          {codeOpen ? (
            <div className="space-y-3 pb-1 pt-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                  placeholder="KOD"
                  className="h-12 min-h-12 text-base uppercase"
                  autoCapitalize="characters"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12"
                  disabled={codeChecking || codeInput.trim().length === 0}
                  onClick={() => void applyCode()}
                >
                  {codeChecking ? "Sprawdzam…" : "Zastosuj"}
                </Button>
              </div>
              {codeMessage ? <p className="text-sm text-primary">{codeMessage}</p> : null}
              {appliedCode ? (
                <p className="text-sm leading-relaxed">
                  Kod {appliedCode.code}: −{formatPrice(appliedCode.discountGrosze)}
                </p>
              ) : null}
              {appliedCode && vouchers.length > 0 && selectedVoucher ? (
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    Kod zastąpi Twój voucher {voucherLabel(selectedVoucher.type)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="min-h-12"
                      variant={usingCode ? "default" : "outline"}
                      onClick={() => setUseVoucher(false)}
                    >
                      Użyj kodu
                    </Button>
                    <Button
                      type="button"
                      className="min-h-12"
                      variant={useVoucher ? "default" : "outline"}
                      onClick={() => setUseVoucher(true)}
                    >
                      Zostaw voucher
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {vouchers.length > 0 && selectedVoucher ? (
          <div className="space-y-2 rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3">
            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={useVoucher}
                onChange={(event) => setUseVoucher(event.target.checked)}
                className="mt-1 size-5 shrink-0"
              />
              <span>Masz voucher {voucherLabel(selectedVoucher.type)}</span>
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

        {discountGrosze > 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Suma: {formatPrice(subtotal)}</p>
            <p className="text-sm text-muted-foreground">Rabat: −{formatPrice(discountGrosze)}</p>
            <p className="text-lg font-medium">Do zapłaty: {formatPrice(payableGrosze)}</p>
          </div>
        ) : (
          <p className="text-lg font-medium">Suma: {formatPrice(subtotal)}</p>
        )}
        {belowMinimum ? (
          <p className="text-sm leading-relaxed text-primary">
            Dodaj jeszcze produkt — po rabacie zamówienie musi mieć min. 2,00 zł.
          </p>
        ) : null}
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

        {overstock.size > 0 || dayExpired || belowMinimum ? (
          <Button type="button" size="lg" className="min-h-12 w-full text-base" disabled>
            Przejdź do płatności · {formatPrice(payableGrosze)}
          </Button>
        ) : isLoggedIn ? (
          <Button
            type="button"
            size="lg"
            className="min-h-12 w-full text-base"
            disabled={!canPay || isPending}
            onClick={handlePay}
          >
            Przejdź do płatności · {formatPrice(payableGrosze)}
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
