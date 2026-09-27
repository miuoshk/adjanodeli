"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateStandingOrder } from "@/lib/standing-orders/actions";
import { WEEKDAY_LABELS } from "@/lib/standing-orders/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { nbsp } from "@/lib/typography";

export type StandingOrderCard = {
  id: string;
  name: string;
  pickup_point_id: string;
  weekdays: number[];
  is_active: boolean;
};

export type StandingPickupPoint = {
  id: string;
  name: string;
};

type StandingOrdersManagerProps = {
  orders: StandingOrderCard[];
  points: StandingPickupPoint[];
};

const cardClass =
  "space-y-5 rounded-[4px] border border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)] px-5 py-5 lg:px-6";

export function StandingOrdersManager({ orders, points }: StandingOrdersManagerProps) {
  if (orders.length === 0) {
    return (
      <p className="text-[15px] leading-relaxed text-[var(--adj-ink-soft)]">
        Nie masz stałych zamówień. Po opłaceniu zamówienia możesz je zapisać jako stałe.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id}>
          <StandingOrderEditor order={order} points={points} />
        </li>
      ))}
    </ul>
  );
}

function StandingOrderEditor({
  order,
  points,
}: {
  order: StandingOrderCard;
  points: StandingPickupPoint[];
}) {
  const [weekdays, setWeekdays] = useState(order.weekdays);
  const [pickupPointId, setPickupPointId] = useState(order.pickup_point_id);
  const [isActive, setIsActive] = useState(order.is_active);
  const [isPending, startTransition] = useTransition();

  function toggleDay(day: number) {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort(),
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-[22px] font-medium">{nbsp(order.name)}</h2>
        <label className="flex items-center gap-2 text-[15px]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="size-5 shrink-0 rounded-[3px] border border-[var(--adj-ink)]/40 accent-[var(--adj-khaki)]"
          />
          Włączone
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {WEEKDAY_LABELS.map((day) => {
          const checked = weekdays.includes(day.id);
          const label = day.id === 7 ? "nd" : day.label;
          return (
            <label
              key={day.id}
              className={cn(
                "adj-label flex min-h-12 min-w-[52px] cursor-pointer items-center justify-center rounded-[6px] border px-2 text-[11px]",
                checked
                  ? "border-[var(--adj-khaki)] bg-[var(--adj-khaki)] text-[var(--adj-cream)]"
                  : "border-[rgba(43,42,31,0.22)] bg-[var(--adj-cream)]",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleDay(day.id)}
                className="sr-only"
              />
              {label}
            </label>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`point-${order.id}`}>Punkt odbioru</Label>
        <Select value={pickupPointId} onValueChange={setPickupPointId}>
          <SelectTrigger id={`point-${order.id}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {points.map((point) => (
              <SelectItem key={point.id} value={point.id}>
                {point.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isPending || weekdays.length === 0}
        onClick={() => {
          startTransition(async () => {
            const result = await updateStandingOrder({
              id: order.id,
              weekdays,
              pickupPointId,
              isActive,
            });
            toast(result.ok ? "Zapisane." : result.message);
          });
        }}
      >
        Zapisz
      </Button>
    </div>
  );
}
