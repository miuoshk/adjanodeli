"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveStandingOrderFromPaid } from "@/lib/standing-orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SaveStandingOrderButtonProps = {
  orderId: string;
  standingCount: number;
};

export function SaveStandingOrderButton({
  orderId,
  standingCount,
}: SaveStandingOrderButtonProps) {
  const [name, setName] = useState("Moje śniadanie");
  const [isPending, startTransition] = useTransition();

  if (standingCount >= 3) {
    return <p className="text-sm text-muted-foreground">Masz już 3 stałe zamówienia.</p>;
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
      <Label htmlFor="standing-name">Zapisz jako stałe zamówienie</Label>
      <Input
        id="standing-name"
        value={name}
        maxLength={80}
        onChange={(event) => setName(event.target.value)}
        className="h-12 min-h-12 text-base"
      />
      <Button
        type="button"
        size="lg"
        variant="secondary"
        className="min-h-12 w-full"
        disabled={isPending || name.trim().length === 0}
        onClick={() => {
          startTransition(async () => {
            const result = await saveStandingOrderFromPaid({ orderId, name });
            if (result.ok) {
              toast("Zapisane. Znajdziesz je w koncie → stałe zamówienia.");
              return;
            }
            toast(result.message);
          });
        }}
      >
        Zapisz jako stałe zamówienie
      </Button>
    </div>
  );
}
