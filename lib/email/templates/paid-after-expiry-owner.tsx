import { EmailShell } from "@/lib/email/templates/shell";

type PaidAfterExpiryOwnerEmailProps = {
  orderNumber: number;
  customerEmail: string;
  total: string;
  pointName: string;
  pickupDateLabel: string;
  adminUrl: string;
  ownerPhone: string | null;
};

export function PaidAfterExpiryOwnerEmail({
  orderNumber,
  customerEmail,
  total,
  pointName,
  pickupDateLabel,
  adminUrl,
  ownerPhone,
}: PaidAfterExpiryOwnerEmailProps) {
  return (
    <EmailShell title="Zapłacone po wygaśnięciu" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 12px", fontWeight: 700 }}>
        Klient zapłacił za wygasłe zamówienie #{orderNumber}
      </p>
      <p style={{ margin: "0 0 8px" }}>{customerEmail}</p>
      <p style={{ margin: "0 0 8px" }}>Kwota: {total}</p>
      <p style={{ margin: "0 0 8px" }}>
        {pointName} · {pickupDateLabel}
      </p>
      <p style={{ margin: "0 0 12px" }}>
        <a href={adminUrl} style={{ color: "#A6231F" }}>
          Otwórz zamówienie w panelu
        </a>
      </p>
      <p style={{ margin: 0 }}>Zrób zwrot w Stripe albo zadzwoń do klienta.</p>
    </EmailShell>
  );
}
