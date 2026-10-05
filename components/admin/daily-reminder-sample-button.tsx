"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sendOwnerDailyReminderSample } from "@/lib/reminders/actions";

export function DailyReminderSampleButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="min-h-12"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await sendOwnerDailyReminderSample();
            if (!result.ok) {
              setError(result.message);
              return;
            }
            toast("Próbne przypomnienie wysłane.");
          });
        }}
      >
        Wyślij do mnie próbne przypomnienie
      </Button>
      {error ? <p className="mt-2 text-sm text-[var(--adj-red)]">{error}</p> : null}
    </div>
  );
}
