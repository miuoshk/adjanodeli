"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelMyOrder } from "@/lib/orders/cancel-my-order";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CancelOrderButtonProps = {
  orderId: string;
  deadlineLabel: string;
};

export function CancelOrderButton({ orderId, deadlineLabel }: CancelOrderButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="lg" className="min-h-12 w-full">
          Anuluj zamówienie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anulować zamówienie?</DialogTitle>
          <DialogDescription>
            Możesz anulować do {deadlineLabel}. Pieniądze wrócą na konto, z którego płaciłaś.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" className="min-h-12" onClick={() => setOpen(false)}>
            Zostaw
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-12"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await cancelMyOrder(orderId);
                toast(result.message);
                if (result.ok) {
                  setOpen(false);
                  router.refresh();
                }
              });
            }}
          >
            Anuluj zamówienie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
