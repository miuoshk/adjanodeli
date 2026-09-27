"use client";

import { useEffect, useState, useTransition } from "react";

import { sendOtp, verifyOtp } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  next: string;
};

const cardClass =
  "mt-8 space-y-5 rounded-[4px] border border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)] px-5 py-5 lg:px-6";

export function LoginForm({ next }: LoginFormProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  function handleSend(targetEmail: string) {
    setError(null);
    startTransition(async () => {
      const result = await sendOtp(targetEmail);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEmail(targetEmail);
      setStep("code");
      setSecondsLeft(30);
    });
  }

  return (
    <form
      className={cardClass}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (step === "email") {
          handleSend(String(form.get("email") ?? ""));
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await verifyOtp(email, String(form.get("token") ?? ""), next);
          if (result?.error) {
            setError(result.error);
          }
        });
      }}
    >
      {step === "email" ? (
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={email}
            placeholder="jan@firma.pl"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Wysłaliśmy kod na {email}. Sprawdź też spam.
          </p>
          <div className="space-y-2">
            <Label htmlFor="token">Kod z e-maila</Label>
            <Input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={8}
              pattern="\d{6,8}"
              required
              className="text-center font-label text-[28px] tracking-[0.35em] [font-stretch:75%]"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 8));
              }}
            />
          </div>
        </div>
      )}

      {error ? <p className="adj-ui text-[15px] text-[var(--adj-red)]">{error}</p> : null}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {step === "email" ? "Wyślij kod" : "Zaloguj"}
      </Button>

      {step === "code" ? (
        <div className="flex flex-col items-center">
          <Button
            type="button"
            variant="link"
            className="h-auto"
            disabled={isPending || secondsLeft > 0}
            onClick={() => handleSend(email)}
          >
            {secondsLeft > 0 ? `Wyślij ponownie (${secondsLeft} s)` : "Wyślij ponownie"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="h-auto"
            disabled={isPending}
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
          >
            Zmień e‑mail
          </Button>
        </div>
      ) : null}
    </form>
  );
}
