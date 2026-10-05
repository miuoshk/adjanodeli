"use client";

import { useState, useTransition } from "react";

import { DAILY_REMINDER_CONSENT } from "@/lib/reminders/consent";
import { setDailyReminder } from "@/lib/reminders/actions";
import { Button } from "@/components/ui/button";

export function DailyReminderAsk({ variant }: { variant: "card" | "banner" }) {
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (hidden) {
    return null;
  }

  function choose(enabled: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setDailyReminder(enabled);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setHidden(true);
    });
  }

  const actions = (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button type="button" size="lg" disabled={pending} onClick={() => choose(true)}>
        Tak, przypominaj
      </Button>
      <button
        type="button"
        className="adj-link text-sm"
        disabled={pending}
        onClick={() => choose(false)}
      >
        Nie, dziękuję
      </button>
    </div>
  );

  if (variant === "banner") {
    return (
      <div className="border-b border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)] px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
          <div>
            <p>Przypomnieć Ci jutro o 18:00, żeby zamówić na kolejny dzień?</p>
            {actions}
            <p className="mt-2 text-sm text-[var(--adj-ink-soft)]">{DAILY_REMINDER_CONSENT}</p>
            {error ? <p className="mt-2 text-sm text-[var(--adj-red)]">{error}</p> : null}
          </div>
          <button
            type="button"
            className="min-h-12 min-w-12 text-xl"
            aria-label="Zamknij"
            disabled={pending}
            onClick={() => choose(false)}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-[4px] border border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)] px-5 py-5">
      <h2 className="font-heading text-[22px] font-medium">
        Przypomnieć Ci jutro o 18:00, żeby zamówić na kolejny dzień?
      </h2>
      {actions}
      <p className="mt-3 text-sm text-[var(--adj-ink-soft)]">{DAILY_REMINDER_CONSENT}</p>
      {error ? <p className="mt-2 text-sm text-[var(--adj-red)]">{error}</p> : null}
    </section>
  );
}
