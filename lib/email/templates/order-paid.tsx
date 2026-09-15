import { EmailShell } from "@/lib/email/templates/shell";

const red = "#C4161C";
const khaki = "#4B4A2F";

export type OrderPaidItem = {
  name: string;
  qty: number;
  lineTotal: string;
};

type OrderPaidEmailProps = {
  orderNumber: number;
  pickupCode: string;
  detailsUrl: string;
  pointName: string;
  pointAddress: string;
  timeRange: string;
  pickupDateLabel: string;
  items: OrderPaidItem[];
  total: string;
  ownerPhone: string | null;
};

export function OrderPaidEmail({
  orderNumber,
  pickupCode,
  detailsUrl,
  pointName,
  pointAddress,
  timeRange,
  pickupDateLabel,
  items,
  total,
  ownerPhone,
}: OrderPaidEmailProps) {
  return (
    <EmailShell title="AdjanoDeli" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 16px" }}>Zamówienie #{orderNumber} jest opłacone.</p>
      <p
        style={{
          margin: "0 0 8px",
          color: red,
          fontSize: "40px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          lineHeight: 1.1,
        }}
      >
        {pickupCode}
      </p>
      <p style={{ margin: "0 0 20px" }}>
        <a href={detailsUrl} style={{ color: red }}>
          Pokaż QR i szczegóły
        </a>
      </p>
      <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{pointName}</p>
      <p style={{ margin: "0 0 4px" }}>{pointAddress}</p>
      <p style={{ margin: "0 0 4px" }}>{pickupDateLabel}</p>
      <p style={{ margin: "0 0 20px" }}>{timeRange}</p>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "16px" }}>
        {items.map((item) => (
          <tr key={`${item.name}-${item.qty}`}>
            <td style={{ padding: "4px 0", color: khaki }}>
              {item.name} × {item.qty}
            </td>
            <td style={{ padding: "4px 0", textAlign: "right" }}>{item.lineTotal}</td>
          </tr>
        ))}
      </table>
      <p style={{ margin: 0, fontWeight: 700 }}>Suma: {total}</p>
    </EmailShell>
  );
}
