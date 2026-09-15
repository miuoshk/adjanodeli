"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { changeOrderStatus } from "@/lib/admin/actions";
import { getAvailableTransitions, type StatusTransition } from "@/lib/admin/order-transitions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type OrderActionsProps = {
  orderId: string;
  status: string;
  isOwner: boolean;
  variant: "menu" | "panel";
};

export function OrderActions({ orderId, status, isOwner, variant }: OrderActionsProps) {
  const actions = getAvailableTransitions(status, isOwner);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (actions.length === 0) {
    return null;
  }

  function run(action: StatusTransition, note = "") {
    if (action.needsNote) {
      setCancelOpen(true);
      return;
    }
    startTransition(async () => {
      const result = await changeOrderStatus(orderId, action.status, note);
      if (!result.ok) {
        toast(result.message);
        return;
      }
      toast(action.label);
    });
  }

  const buttons = actions.map((action) => (
    <Button
      key={action.status}
      type="button"
      variant={action.status === "cancelled" ? "outline" : "default"}
      size={variant === "menu" ? "sm" : "default"}
      className={variant === "panel" ? "min-h-12" : "min-h-10 w-full justify-start"}
      disabled={isPending}
      onClick={() => run(action)}
    >
      {action.label}
    </Button>
  ));

  return (
    <>
      {variant === "menu" ? (
        <details className="relative">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-end text-sm underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
            Akcje
          </summary>
          <div className="absolute right-0 z-20 mt-1 flex min-w-48 flex-col gap-1 rounded-md border border-[var(--adj-cream-dark)] bg-card p-2 shadow-md">
            {buttons}
          </div>
        </details>
      ) : (
        <div className="flex flex-wrap gap-2">{buttons}</div>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anulować zamówienie?</DialogTitle>
            <DialogDescription>
              Zwrot środków zrób w Stripe, potem oznacz jako zwrócone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`cancel-reason-${orderId}`}>Powód</Label>
            <textarea
              id={`cancel-reason-${orderId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={200}
              className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-12" onClick={() => setCancelOpen(false)}>
              Wstecz
            </Button>
            <Button
              type="button"
              className="min-h-12"
              disabled={isPending || reason.trim().length === 0}
              onClick={() => {
                startTransition(async () => {
                  const result = await changeOrderStatus(orderId, "cancelled", reason);
                  if (!result.ok) {
                    toast(result.message);
                    return;
                  }
                  toast("Zamówienie anulowane.");
                  setCancelOpen(false);
                  setReason("");
                });
              }}
            >
              Anuluj zamówienie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
