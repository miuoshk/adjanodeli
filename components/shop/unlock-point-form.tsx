"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PointCodeHint } from "@/components/shop/point-code-hint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeAccessCode } from "@/lib/pickup/access-code";
import { unlockPickupPoint, type UnlockedPickupPoint } from "@/lib/pickup/unlock-point";

type UnlockPointFormProps = {
  isLoggedIn: boolean;
  next?: string;
  onUnlocked?: (point: UnlockedPickupPoint) => void;
  initialCode?: string;
  prominent?: boolean;
};

export function UnlockPointForm({
  isLoggedIn,
  next = "/koszyk",
  onUnlocked,
  initialCode = "",
  prominent = false,
}: UnlockPointFormProps) {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const normalized = normalizeAccessCode(code);
    if (!normalized) {
      return;
    }
    if (!isLoggedIn) {
      const joiner = next.includes("?") ? "&" : "?";
      const target = `${next}${joiner}kod=${encodeURIComponent(normalized)}`;
      window.location.href = `/logowanie?next=${encodeURIComponent(target)}`;
      return;
    }

    startTransition(async () => {
      const result = await unlockPickupPoint(normalized);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setCode("");
      setError(null);
      toast(`Odblokowano punkt: ${result.name}`);
      onUnlocked?.(result);
    });
  }

  return (
    <div className="space-y-2">
      {prominent ? <Label htmlFor="point-code">Kod punktu odbioru</Label> : null}
      <div className={prominent ? "flex flex-col gap-2" : "flex flex-col gap-2 sm:flex-row"}>
        <Input
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(null);
          }}
          maxLength={24}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          id={prominent ? "point-code" : "employer-code"}
          placeholder="Kod"
          className={
            prominent
              ? "min-h-14 text-lg uppercase"
              : "min-h-12 uppercase sm:max-w-48"
          }
          aria-label="Kod punktu odbioru"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="button"
          variant={prominent ? "default" : "outline"}
          className="min-h-12"
          disabled={isPending || normalizeAccessCode(code).length === 0}
          onClick={submit}
        >
          {prominent ? "Dalej" : "Odblokuj"}
        </Button>
      </div>
      {prominent ? <PointCodeHint /> : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </div>
  );
}
