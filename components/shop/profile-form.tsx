"use client";

import { useState, useTransition } from "react";

import { updateProfile } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  fullName?: string | null;
  phone?: string | null;
  marketingConsent?: boolean | null;
  next: string;
  submitLabel: string;
};

export function ProfileForm({
  fullName,
  phone,
  marketingConsent,
  next,
  submitLabel,
}: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await updateProfile({
            full_name: String(form.get("full_name") ?? ""),
            phone: String(form.get("phone") ?? ""),
            marketing_consent: form.get("marketing_consent") === "on",
            next,
          });
          if (result?.error) {
            setError(result.error);
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="full_name">Imię i nazwisko</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          defaultValue={fullName ?? ""}
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon (opcjonalnie)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={phone ?? ""}
          placeholder="500123456 albo +48500123456"
          autoComplete="tel"
        />
      </div>
      <label className="flex min-h-12 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="marketing_consent"
          defaultChecked={Boolean(marketingConsent)}
          className="size-5 shrink-0 rounded-[3px] border border-[var(--adj-ink)]/40 accent-[var(--adj-khaki)]"
        />
        Chcę dostać maila, gdy pojawi się coś nowego w menu.
      </label>
      {error ? <p className="adj-ui text-[15px] text-[var(--adj-red)]">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
