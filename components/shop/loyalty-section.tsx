import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { voucherLabel } from "@/lib/loyalty/discount";
import type { LoyaltyStatus } from "@/lib/loyalty/status";

type LoyaltySectionProps = {
  status: LoyaltyStatus;
};

export function LoyaltySection({ status }: LoyaltySectionProps) {
  const { active_stamps: stamps, next_threshold: next, vouchers } = status;
  const percent = Math.min(100, Math.round((stamps / next) * 100));

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Pieczątki</h2>
      <p className="text-sm">
        {stamps}/{next}
      </p>
      <div
        className="h-3 overflow-hidden rounded-full bg-[var(--adj-cream-dark)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={next}
        aria-valuenow={stamps}
        aria-label={`Pieczątki ${stamps} z ${next}`}
      >
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      {vouchers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie masz jeszcze vouchera.</p>
      ) : (
        <ul className="space-y-2">
          {vouchers.map((voucher) => (
            <li
              key={voucher.id}
              className="rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3 text-sm"
            >
              <p className="font-medium">Voucher {voucherLabel(voucher.type)}</p>
              <p className="text-muted-foreground">
                ważny do {format(new Date(voucher.expires_at), "d MMM", { locale: pl })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
