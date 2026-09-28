"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SectionHeading } from "@/components/brand/section-heading";

const POLL_MS = 60_000;
const INTERVAL_MS = 3_000;

type PaymentCheckPollProps = {
  orderId: string;
  orderNumber: number;
};

export function PaymentCheckPoll({ orderId, orderNumber }: PaymentCheckPollProps) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const key = `payment-check:${orderId}`;
    const startedAt = Number(sessionStorage.getItem(key)) || Date.now();
    sessionStorage.setItem(key, String(startedAt));

    if (Date.now() - startedAt >= POLL_MS) {
      setTimedOut(true);
      return;
    }

    const timer = window.setInterval(() => {
      if (Date.now() - startedAt >= POLL_MS) {
        sessionStorage.removeItem(key);
        setTimedOut(true);
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [orderId, router]);

  if (timedOut) {
    return (
      <div className="space-y-6">
        <p className="max-w-[36em] font-heading text-[2rem] leading-tight font-medium">
          Płatność jeszcze się przetwarza. Mail z kodem odbioru przyjdzie za chwilę, a zamówienie
          znajdziesz w Moich zamówieniach.
        </p>
        <Link href="/moje-zamowienia" className="adj-link inline-block">
          Moje zamówienia
        </Link>
      </div>
    );
  }

  return (
    <SectionHeading
      as="h1"
      eyebrow={`Zamówienie #${orderNumber}`}
      title="Potwierdzamy płatność…"
    />
  );
}
