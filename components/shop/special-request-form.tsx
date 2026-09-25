"use client";

import { useState } from "react";
import { toast } from "sonner";

import { submitSpecialRequest } from "@/lib/special-requests/submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SpecialRequestForm() {
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [wantedDate, setWantedDate] = useState("");
  const [description, setDescription] = useState("");

  if (done) {
    return (
      <div className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-6">
        <h2 className="font-heading text-2xl font-semibold">Dziękujemy</h2>
        <p className="leading-relaxed">
          Odezwiemy się w ciągu jednego dnia roboczego.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSaving(true);
        void submitSpecialRequest({ name, phone, email, wantedDate, description }).then((result) => {
          setSaving(false);
          if (!result.ok) {
            toast(result.message);
            return;
          }
          setDone(true);
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="sr-name">Imię / firma</Label>
        <Input
          id="sr-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sr-phone">Telefon</Label>
        <Input
          id="sr-phone"
          type="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="min-h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sr-email">E-mail</Label>
        <Input
          id="sr-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sr-date">Planowana data</Label>
        <Input
          id="sr-date"
          type="date"
          value={wantedDate}
          onChange={(event) => setWantedDate(event.target.value)}
          className="min-h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sr-desc">Opis</Label>
        <textarea
          id="sr-desc"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Co, ile, dla ilu osób"
          className="min-h-24 w-full rounded-[6px] border border-[rgba(43,42,31,0.28)] bg-[var(--adj-paper-light)] px-4 py-3 text-base shadow-none outline-none placeholder:text-muted-foreground focus-visible:border-[var(--adj-khaki)] focus-visible:ring-[3px] focus-visible:ring-[var(--adj-gold)]/35"
        />
      </div>
      <Button type="submit" className="min-h-12" disabled={saving}>
        Wyślij
      </Button>
    </form>
  );
}
