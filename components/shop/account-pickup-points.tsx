"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { formatDatePl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { UnlockPointForm } from "@/components/shop/unlock-point-form";

export type AccountPickupAccess = {
  name: string;
  grantedAt: string;
};

export function AccountPickupPoints({ accesses }: { accesses: AccountPickupAccess[] }) {
  const router = useRouter();
  const [showCode, setShowCode] = useState(false);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Moje punkty odbioru</h2>
      {accesses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie masz jeszcze odblokowanego punktu.</p>
      ) : (
        <ul className="space-y-2">
          {accesses.map((access) => (
            <li key={`${access.name}-${access.grantedAt}`} className="text-sm leading-relaxed">
              <span className="font-medium">{access.name}</span>
              <span className="text-muted-foreground"> · {formatDatePl(access.grantedAt)}</span>
            </li>
          ))}
        </ul>
      )}
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
        <Button type="button" variant="outline" className="min-h-12" onClick={() => setShowCode(true)}>
          Wpisz kolejny kod
        </Button>
      )}
    </section>
  );
}
