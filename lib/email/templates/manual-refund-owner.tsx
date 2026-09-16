import { EmailShell } from "@/lib/email/templates/shell";

type ManualRefundOwnerEmailProps = {
  orderNumber: number;
  customerName: string;
  total: string;
  ownerPhone: string | null;
};

export function ManualRefundOwnerEmail({
  orderNumber,
  customerName,
  total,
  ownerPhone,
}: ManualRefundOwnerEmailProps) {
  return (
    <EmailShell title="AdjanoDeli" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 12px", fontWeight: 700 }}>
        Zwrot ręczny wymagany #{orderNumber}
      </p>
      <p style={{ margin: "0 0 8px" }}>{customerName}</p>
      <p style={{ margin: 0 }}>Kwota: {total}. Stripe nie zwrócił automatycznie.</p>
    </EmailShell>
  );
}
