"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resendOrderDeliveredMail, resendOrderPaidMail } from "@/lib/admin/email-actions";

type OrderMailButtonsProps = {
  orderId: string;
  status: string;
};

export function OrderMailButtons({ orderId, status }: OrderMailButtonsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"paid" | "delivered" | null>(null);
  const canResendPaid = status === "paid" || status === "in_production" || status === "delivered";
  const canResendDelivered = status === "delivered";

  async function run(which: "paid" | "delivered") {
    setPending(which);
    try {
      const result =
        which === "paid" ? await resendOrderPaidMail(orderId) : await resendOrderDeliveredMail(orderId);
      toast(result.message);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  if (!canResendPaid && !canResendDelivered) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canResendPaid ? (
        <Button type="button" variant="outline" disabled={pending !== null} onClick={() => run("paid")}>
          {pending === "paid" ? "Wysyłam…" : "Wyślij ponownie potwierdzenie"}
        </Button>
      ) : null}
      {canResendDelivered ? (
        <Button type="button" variant="outline" disabled={pending !== null} onClick={() => run("delivered")}>
          {pending === "delivered" ? "Wysyłam…" : "Wyślij ponownie „paczka czeka”"}
        </Button>
      ) : null}
    </div>
  );
}
