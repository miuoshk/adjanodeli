"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { unlockPickupPoint, type UnlockedPickupPoint } from "@/lib/pickup/unlock-point";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UnlockPointFormProps = {
  isLoggedIn: boolean;
  next?: string;
  onUnlocked?: (point: UnlockedPickupPoint) => void;
};

export function UnlockPointForm({ isLoggedIn, next = "/koszyk", onUnlocked }: UnlockPointFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href={`/logowanie?next=${encodeURIComponent(next)}`} className="underline underline-offset-4">
          Zaloguj się
        </Link>
        , żeby wpisać kod.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            setError(null);
          }}
          maxLength={12}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Kod"
          className="min-h-12 font-mono text-base uppercase sm:max-w-48"
          aria-label="Kod od pracodawcy"
        />
        <Button
          type="button"
          variant="outline"
          className="min-h-12"
          disabled={isPending || code.trim().length === 0}
          onClick={() => {
            startTransition(async () => {
              const result = await unlockPickupPoint(code);
              if (!result.ok) {
                setError(result.message);
                return;
              }
              setCode("");
              setError(null);
              toast(`Odblokowano punkt: ${result.name}`);
              onUnlocked?.(result);
            });
          }}
        >
          Odblokuj
        </Button>
      </div>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </div>
  );
}
