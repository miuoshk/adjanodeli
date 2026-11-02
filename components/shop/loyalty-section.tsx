import { format } from "date-fns";
import { pl } from "date-fns/locale";
import Image from "next/image";

import { voucherLabel } from "@/lib/loyalty/discount";
import type { LoyaltyStatus } from "@/lib/loyalty/status";
import { cn } from "@/lib/utils";

type LoyaltySectionProps = {
  status: LoyaltyStatus;
};

const REWARD = "10 zamówień: −30% (maks. 40 zł)";

export function LoyaltySection({ status }: LoyaltySectionProps) {
  const { active_stamps: stamps, next_threshold: next, vouchers } = status;
  const filled = Math.min(stamps, 10);

  return (
    <section>
      <div className="adj-framed px-6 py-7">
        <div className="flex items-baseline justify-between gap-4">
          <p className="adj-label text-[var(--adj-ink-soft)]">Karta pieczątek</p>
          <p className="adj-ui text-[15px]">
            {stamps} / {next}
          </p>
        </div>
        <div className="mt-5" aria-label={`Pieczątki ${filled} z 10`}>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 10 }, (_, index) => {
              const earned = index < filled;
              return (
                <div
                  key={index}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-full border",
                    earned
                      ? "border-[var(--adj-red)] bg-[var(--adj-red)]/10"
                      : "border-dashed border-[rgba(43,42,31,0.3)]",
                  )}
                >
                  {earned ? (
                    <Image
                      src="/brand/logo/znak-A-sam-karmin.svg"
                      alt=""
                      width={185}
                      height={161}
                      className={cn(
                        "h-auto w-[62%]",
                        index % 2 === 0 ? "rotate-[-8deg]" : "rotate-[6deg]",
                      )}
                      aria-hidden
                      unoptimized
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="adj-ui mt-2 text-[13px] text-[var(--adj-ink-soft)]">{REWARD}</p>
        </div>
        <p className="mt-4 text-[15px] text-[var(--adj-ink-soft)]">
          Pieczątka za każde opłacone zamówienie. Ważna 60 dni.
        </p>
      </div>

      {vouchers.length === 0 ? (
        <p className="mt-4 text-[15px] text-[var(--adj-ink-soft)]">
          Voucher −30% pojawi się przy 10 zamówieniach.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {vouchers.map((voucher) => (
            <li
              key={voucher.id}
              className="flex items-center justify-between gap-4 border border-dashed border-[var(--adj-red)] bg-[var(--adj-paper-light)] px-5 py-4"
            >
              <span className="font-heading text-[22px] font-medium">
                {voucherLabel(voucher.type)}
              </span>
              <span className="adj-ui text-[14px] text-[var(--adj-ink-soft)]">
                ważny do {format(new Date(voucher.expires_at), "d MMMM", { locale: pl })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
