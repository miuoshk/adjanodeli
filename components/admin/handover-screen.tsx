"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  findOrderByCode,
  forceIssueOrder,
  getReadyToPickUp,
  markOrderPickedUp,
  searchHandoverOrder,
} from "@/lib/admin/actions";
import type { HandoverOrder, HandoverPoint, HandoverReadyItem } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const POINT_STORAGE_KEY = "adjanodeli-pickup-point";

type HandoverScreenProps = {
  day: string;
  points: HandoverPoint[];
};

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function normalizeCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
}

function formatPickedUpAt(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function HandoverScreen({ day, points }: HandoverScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCodeRef = useRef("");
  const [pointId, setPointId] = useState("");
  const [code, setCode] = useState("");
  const [fallbackQuery, setFallbackQuery] = useState("");
  const [order, setOrder] = useState<HandoverOrder | null>(null);
  const [fallbackOrders, setFallbackOrders] = useState<HandoverOrder[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [ready, setReady] = useState<HandoverReadyItem[]>([]);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isIssuing, startIssue] = useTransition();

  function resetLookup() {
    setOrder(null);
    setFallbackOrders(null);
    setNotFound(false);
    setFallbackQuery("");
    lastCodeRef.current = "";
  }

  function clearToEmptyField() {
    setCode("");
    resetLookup();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function refreshReady(nextPointId: string) {
    if (!nextPointId) {
      setReady([]);
      return;
    }
    const result = await getReadyToPickUp(day, nextPointId);
    setReady(result.items);
  }

  function showSuccess(name: string) {
    setSuccessName(firstNameOf(name));
    window.setTimeout(() => {
      setSuccessName(null);
      clearToEmptyField();
      void refreshReady(pointId);
    }, 1500);
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(POINT_STORAGE_KEY);
    const next =
      (saved && points.some((point) => point.id === saved) ? saved : null) ?? points[0]?.id ?? "";
    setPointId(next);
  }, [points]);

  useEffect(() => {
    if (!pointId) {
      return;
    }
    window.localStorage.setItem(POINT_STORAGE_KEY, pointId);
    void refreshReady(pointId);
  }, [pointId, day]);

  useEffect(() => {
    resetLookup();
    setCode("");
  }, [day]);

  function lookupCode(nextCode: string) {
    if (nextCode.length !== 4 || nextCode === lastCodeRef.current) {
      return;
    }
    lastCodeRef.current = nextCode;
    startSearch(async () => {
      const result = await findOrderByCode(day, nextCode);
      if (!result.ok) {
        toast(result.message);
        return;
      }
      setFallbackOrders(null);
      setFallbackQuery("");
      if (result.order) {
        setOrder(result.order);
        setNotFound(false);
        return;
      }
      setOrder(null);
      setNotFound(true);
    });
  }

  function onCodeChange(value: string) {
    const next = normalizeCode(value);
    setCode(next);
    if (next.length < 4) {
      setOrder(null);
      setNotFound(false);
      setFallbackOrders(null);
      lastCodeRef.current = "";
      return;
    }
    lookupCode(next);
  }

  function issueDelivered(current: HandoverOrder) {
    startIssue(async () => {
      const result = await markOrderPickedUp(current.id);
      if (!result.ok) {
        toast(result.message);
        return;
      }
      showSuccess(current.customerName);
    });
  }

  function issueAnyway(current: HandoverOrder) {
    startIssue(async () => {
      const result = await forceIssueOrder(current.id, current.status);
      if (!result.ok) {
        toast(result.message);
        return;
      }
      showSuccess(current.customerName);
    });
  }

  function runFallback() {
    startSearch(async () => {
      const result = await searchHandoverOrder(day, fallbackQuery);
      if (!result.ok) {
        toast(result.message);
        return;
      }
      if (result.orders.length === 1) {
        setOrder(result.orders[0]);
        setFallbackOrders(null);
        setNotFound(false);
        return;
      }
      if (result.orders.length > 1) {
        setOrder(null);
        setFallbackOrders(result.orders);
        return;
      }
      setOrder(null);
      setFallbackOrders([]);
    });
  }

  if (successName) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-600 px-6 text-white">
        <p className="font-heading text-center text-5xl font-semibold leading-tight">
          Wydano ✓ {successName}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Punkt odbioru</span>
        <select
          value={pointId}
          onChange={(event) => setPointId(event.target.value)}
          className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base"
        >
          {points.length === 0 ? <option value="">Brak punktów</option> : null}
          {points.map((point) => (
            <option key={point.id} value={point.id}>
              {point.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Kod odbioru</span>
        {/* TODO Faza 3: skaner QR */}
        <input
          ref={inputRef}
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          maxLength={4}
          inputMode="text"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="ABCD"
          className="h-16 w-full rounded-md border border-input bg-card px-3 text-center font-mono text-[32px] tracking-[0.3em] uppercase outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </label>

      {isSearching && !order ? <p className="text-sm text-muted-foreground">Szukam…</p> : null}

      {order ? (
        <OrderCard
          order={order}
          selectedPointId={pointId}
          busy={isIssuing}
          onIssue={() => issueDelivered(order)}
          onForceIssue={() => issueAnyway(order)}
        />
      ) : null}

      {notFound && !order ? (
        <div className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
          <p>Nie ma takiego kodu na dziś. Sprawdź dzień lub poproś o numer zamówienia.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={fallbackQuery}
              onChange={(event) => setFallbackQuery(event.target.value)}
              placeholder="Numer albo nazwisko"
              className="min-h-12 text-base"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runFallback();
                }
              }}
            />
            <Button type="button" className="min-h-12" disabled={isSearching} onClick={runFallback}>
              Szukaj
            </Button>
          </div>
          {fallbackOrders && fallbackOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nie ma takiego zamówienia.</p>
          ) : null}
          {fallbackOrders && fallbackOrders.length > 1 ? (
            <ul className="space-y-2">
              {fallbackOrders.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center justify-between rounded-md border border-[var(--adj-cream-dark)] px-3 text-left"
                    onClick={() => {
                      setOrder(item);
                      setNotFound(false);
                      setFallbackOrders(null);
                    }}
                  >
                    <span className="font-mono font-semibold">{item.pickupCode ?? `#${item.orderNumber}`}</span>
                    <span>{item.customerName}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Do wydania w tym punkcie</h2>
        {ready.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nic nie czeka na odbiór.</p>
        ) : (
          <ul className="space-y-2">
            {ready.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-2xl font-semibold tracking-wide">{item.pickupCode}</p>
                  <p className="truncate">{item.customerName}</p>
                </div>
                <Button
                  type="button"
                  className="min-h-12 bg-green-700 text-white hover:bg-green-800"
                  disabled={isIssuing}
                  onClick={() => {
                    startIssue(async () => {
                      const result = await markOrderPickedUp(item.id);
                      if (!result.ok) {
                        toast(result.message);
                        return;
                      }
                      showSuccess(item.customerName);
                    });
                  }}
                >
                  Wydano
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OrderCard({
  order,
  selectedPointId,
  busy,
  onIssue,
  onForceIssue,
}: {
  order: HandoverOrder;
  selectedPointId: string;
  busy: boolean;
  onIssue: () => void;
  onForceIssue: () => void;
}) {
  const wrongPoint = Boolean(selectedPointId && order.pickupPointId !== selectedPointId);
  const canForce = order.status === "paid" || order.status === "in_production";

  return (
    <article className="space-y-4 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-3xl font-semibold">{order.customerName}</p>
          <p className="font-mono text-lg tracking-wide">{order.pickupCode ?? `#${order.orderNumber}`}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="space-y-1 text-xl font-medium">
        {order.items.map((item) => (
          <li key={`${order.id}-${item.name}`}>
            {item.qty}× {item.name}
          </li>
        ))}
      </ul>

      {order.note?.trim() ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-base">Uwaga: {order.note.trim()}</p>
      ) : null}

      {wrongPoint ? (
        <p className="rounded-md bg-amber-100 px-3 py-2 text-base text-amber-950">
          To zamówienie jest na {order.pickupPointName}
        </p>
      ) : null}

      {order.status === "delivered" ? (
        <Button
          type="button"
          className="min-h-16 w-full bg-green-700 text-xl text-white hover:bg-green-800"
          disabled={busy}
          onClick={onIssue}
        >
          Wydano
        </Button>
      ) : null}

      {order.status === "picked_up" ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-lg font-medium text-red-800">
          {order.pickedUpAt
            ? `Już odebrane o ${formatPickedUpAt(order.pickedUpAt)}`
            : "Już odebrane"}
        </p>
      ) : null}

      {canForce ? (
        <div className="space-y-3 rounded-md bg-amber-100 px-3 py-3 text-amber-950">
          <p>Paczka nie jest jeszcze oznaczona jako dowieziona</p>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full border-amber-800 text-amber-950"
            disabled={busy}
            onClick={onForceIssue}
          >
            Mimo to wydaj
          </Button>
        </div>
      ) : null}
    </article>
  );
}
