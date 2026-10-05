"use client";

import { useState, useTransition } from "react";

import { DAILY_REMINDER_CONSENT } from "@/lib/reminders/consent";
import { setDailyReminder } from "@/lib/reminders/actions";

export function DailyReminderSwitch({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="mt-12 rounded-[4px] border border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)] px-5 py-5 lg:px-6">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-5 shrink-0"
          checked={on}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.checked;
            setError(null);
            startTransition(async () => {
              const result = await setDailyReminder(next);
              if (!result.ok) {
                setError(result.message);
                return;
              }
              setOn(next);
            });
          }}
        />
        <span>
          <span className="block font-heading text-[22px] font-medium">Przypomnienie o 18:00</span>
          <span className="mt-2 block text-sm text-[var(--adj-ink-soft)]">{DAILY_REMINDER_CONSENT}</span>
        </span>
      </label>
      {error ? <p className="mt-3 text-sm text-[var(--adj-red)]">{error}</p> : null}
    </section>
  );
}
