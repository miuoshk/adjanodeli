"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { SectionHeading } from "@/components/brand/section-heading";
import { UnlockPointForm } from "@/components/shop/unlock-point-form";
import { Button } from "@/components/ui/button";
import { nbsp } from "@/lib/typography";

export type AccountPickupAccess = {
  name: string;
  grantedAt: string;
};

export function AccountPickupPoints({ accesses }: { accesses: AccountPickupAccess[] }) {
  const router = useRouter();
  const [showCode, setShowCode] = useState(false);

  return (
    <section className="mt-12">
      <SectionHeading as="h2" title="Punkty odbioru w pracy" />
      {accesses.length === 0 ? (
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--adj-ink-soft)]">
          Nie masz jeszcze punktu w pracy. Kod od pracodawcy wpiszesz w koszyku.
        </p>
      ) : (
        <ul className="mt-6 border-t border-[var(--adj-ink)]">
          {accesses.map((access) => (
            <li
              key={`${access.name}-${access.grantedAt}`}
              className="border-b border-[rgba(43,42,31,0.18)] py-4"
            >
              <p className="font-heading text-[19px] font-medium">{nbsp(access.name)}</p>
              <p className="adj-ui mt-1 text-[14px] text-[var(--adj-ink-soft)]">
                od {format(new Date(access.grantedAt), "d MMMM yyyy", { locale: pl })}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        {showCode ? (
          <UnlockPointForm
            isLoggedIn
            next="/konto"
            onUnlocked={() => {
              setShowCode(false);
              router.refresh();
            }}
          />
        ) : (
          <Button type="button" variant="outline" onClick={() => setShowCode(true)}>
            Wpisz kolejny kod
          </Button>
        )}
      </div>
    </section>
  );
}
