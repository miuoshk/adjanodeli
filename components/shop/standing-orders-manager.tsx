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

export function StandingOrdersManager({ orders, points }: StandingOrdersManagerProps) {
  if (orders.length === 0) {
    return (
      <p className="leading-relaxed text-muted-foreground">
        Nie masz stałych zamówień. Zapisz je z opłaconego zamówienia.
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
    <div className="space-y-4 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">{order.name}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="size-5"
          />
          Włączone
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Dni</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((day) => {
            const checked = weekdays.includes(day.id);
            return (
              <label
                key={day.id}
                className={`flex min-h-12 items-center rounded-md border px-3 text-sm ${
                  checked ? "border-primary bg-primary/10" : "border-input"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDay(day.id)}
                  className="sr-only"
                />
                {day.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`point-${order.id}`}>Punkt odbioru</Label>
        <Select value={pickupPointId} onValueChange={setPickupPointId}>
          <SelectTrigger id={`point-${order.id}`} className="h-12 min-h-12 w-full text-base">
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
        size="lg"
        className="min-h-12 w-full"
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
