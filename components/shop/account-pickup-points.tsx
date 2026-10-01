"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { SectionHeading } from "@/components/brand/section-heading";
import { UnlockPointForm } from "@/components/shop/unlock-point-form";
import { nbsp } from "@/lib/typography";

export type AccountPickupAccess = {
  name: string;
  grantedAt: string;
};

export function AccountPickupPoints({ accesses }: { accesses: AccountPickupAccess[] }) {
  const router = useRouter();

  return (
    <section className="mt-12">
      <SectionHeading as="h2" title="Punkty odbioru" />
      {accesses.length > 0 ? (
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
      ) : null}
      <div className="mt-6 space-y-3">
        <UnlockPointForm
          prominent
          isLoggedIn
          next="/konto"
          onUnlocked={() => {
            router.refresh();
          }}
        />
      </div>
    </section>
  );
}
