"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { formatPrice } from "@/lib/format";
import { payOrder } from "@/lib/orders/pay-order";
import { Button } from "@/components/ui/button";

type PayOrderButtonProps = {
  orderId: string;
  totalGrosze: number;
};

export function PayOrderButton({ orderId, totalGrosze }: PayOrderButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="lg"
      className="min-h-12 w-full text-base"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await payOrder(orderId);
          if (result.ok) {
            window.location.href = result.url;
            return;
          }
          if (result.code === "NOT_PAYABLE") {
            toast("To zamówienie nie może być opłacone.");
            return;
          }
          toast(result.message);
        });
      }}
    >
      Zapłać {formatPrice(totalGrosze)}
    </Button>
  );
}
