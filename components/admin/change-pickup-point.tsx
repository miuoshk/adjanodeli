"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { changeOrderPickupPoint } from "@/lib/admin/actions";
import { formatTimeRange } from "@/lib/format";
import { Button } from "@/components/ui/button";

export type PickupPointChoice = {
  id: string;
  name: string;
  address: string | null;
  pickupFrom: string;
  pickupTo: string;
};

export function ChangePickupPoint({
  orderId,
  choices,
}: {
  orderId: string;
  choices: PickupPointChoice[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pointId, setPointId] = useState(choices[0]?.id ?? "");
  const [notify, setNotify] = useState(true);
  const [isPending, startTransition] = useTransition();

  if (choices.length === 0) {
    return <p className="text-sm text-muted-foreground">Nie ma innego punktu na ten dzień.</p>;
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" className="min-h-12" onClick={() => setOpen(true)}>
        Zmień punkt odbioru
      </Button>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await changeOrderPickupPoint({ orderId, pointId, notify });
          toast(result.message);
          if (!result.ok) {
            return;
          }
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <label className="block space-y-2 text-sm">
        <span>Nowy punkt</span>
        <select
          value={pointId}
          onChange={(event) => setPointId(event.target.value)}
          className="min-h-12 w-full rounded-md border border-[var(--adj-cream-dark)] bg-card px-3 text-base"
        >
          {choices.map((point) => (
            <option key={point.id} value={point.id}>
              {point.name} · {formatTimeRange(point.pickupFrom, point.pickupTo)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-12 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={notify}
          onChange={(event) => setNotify(event.target.checked)}
          className="size-5 shrink-0"
        />
        Powiadom klienta
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" className="min-h-12" disabled={isPending || !pointId}>
          Zapisz punkt
        </Button>
        <Button type="button" variant="outline" className="min-h-12" onClick={() => setOpen(false)}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}
