"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 30_000;
const INTERVAL_MS = 3_000;

type PaymentCheckPollProps = {
  orderId: string;
};

export function PaymentCheckPoll({ orderId }: PaymentCheckPollProps) {
  const router = useRouter();

  useEffect(() => {
    const key = `payment-check:${orderId}`;
    const startedAt = Number(sessionStorage.getItem(key)) || Date.now();
    sessionStorage.setItem(key, String(startedAt));

    const timer = window.setInterval(() => {
      if (Date.now() - startedAt >= POLL_MS) {
        sessionStorage.removeItem(key);
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [orderId, router]);

  return <p className="text-base">Sprawdzamy płatność…</p>;
}
