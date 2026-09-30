"use client";

import { useState, useTransition } from "react";

import { changeOwnPassword } from "@/lib/admin/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm({ mustChange }: { mustChange: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="max-w-md space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await changeOwnPassword(
            String(form.get("password") ?? ""),
            String(form.get("confirm") ?? ""),
          );
          if (result?.error) {
            setError(result.error);
          }
        });
      }}
    >
      {mustChange ? (
        <p className="text-sm leading-relaxed">
          Przy pierwszym logowaniu ustaw swoje hasło. Dopiero potem wejdziesz dalej.
        </p>
      ) : (
        <p className="text-sm leading-relaxed">Nowe hasło, co najmniej 10 znaków. Obecne nie jest potrzebne.</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="new-password">Nowe hasło</Label>
        <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={10} required className="min-h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Powtórz hasło</Label>
        <Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={10} required className="min-h-12" />
      </div>
      {error ? <p className="text-sm text-[var(--adj-red)]">{error}</p> : null}
      <Button type="submit" className="min-h-12 w-full" disabled={isPending}>
        Zmień hasło
      </Button>
    </form>
  );
}
