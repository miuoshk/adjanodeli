"use client";

import { useState, useTransition } from "react";

import { setCustomerBanned } from "@/lib/admin/customer-actions";
import { Button } from "@/components/ui/button";

export function CustomerBanButton({ id, banned }: { id: string; banned: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1 text-right">
      <Button
        type="button"
        variant="outline"
        className="min-h-10"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setCustomerBanned(id, !banned);
            if (!result.ok) {
              setError(result.error);
            }
          });
        }}
      >
        {banned ? "Odblokuj" : "Zablokuj"}
      </Button>
      {error ? <p className="text-sm text-[var(--adj-red)]">{error}</p> : null}
    </div>
  );
}
