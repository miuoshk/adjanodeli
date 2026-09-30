"use client";

import { useState } from "react";

import { generateTempPassword } from "@/lib/admin/staff-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TempPasswordField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Hasło tymczasowe</Label>
      <Input id={id} readOnly value={value} className="min-h-12 font-mono" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="min-h-12"
          onClick={() => {
            onChange(generateTempPassword());
            setCopied(false);
          }}
        >
          Wygeneruj
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-12"
          disabled={!value}
          onClick={async () => {
            if (!value) {
              return;
            }
            await navigator.clipboard.writeText(value);
            setCopied(true);
          }}
        >
          {copied ? "Skopiowane" : "Kopiuj"}
        </Button>
      </div>
    </div>
  );
}

export function PasswordHandoff({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
      <p className="font-medium">Hasło tymczasowe</p>
      <p className="break-all font-mono text-lg">{password}</p>
      <Button
        type="button"
        variant="outline"
        className="min-h-12"
        onClick={async () => {
          await navigator.clipboard.writeText(password);
          setCopied(true);
        }}
      >
        {copied ? "Skopiowane" : "Kopiuj"}
      </Button>
      <p className="text-sm leading-relaxed">
        Przekaż je pracownikowi osobiście albo telefonicznie. Przy pierwszym logowaniu poprosimy o zmianę.
      </p>
    </div>
  );
}
