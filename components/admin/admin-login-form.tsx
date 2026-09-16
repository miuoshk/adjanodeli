"use client";

import { useState, useTransition } from "react";

import { signInAdmin } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminLoginFormProps = {
  next: string;
};

export function AdminLoginForm({ next }: AdminLoginFormProps) {
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
          const result = await signInAdmin({
            username: String(form.get("username") ?? ""),
            password: String(form.get("password") ?? ""),
            next,
          });
          if (result?.error) {
            setError(result.error);
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="username">Login</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
          className="min-h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-12"
        />
      </div>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <Button type="submit" size="lg" className="min-h-12 w-full" disabled={isPending}>
        Wejdź do panelu
      </Button>
    </form>
  );
}
