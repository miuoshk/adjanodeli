import { EmailShell } from "@/lib/email/templates/shell";

const red = "#C4161C";
const khaki = "#4B4A2F";

export type StandingReminderItem = {
  name: string;
  qty: number;
  lineTotal: string;
};

type StandingReminderEmailProps = {
  standingName: string;
  pickupDateLabel: string;
  items: StandingReminderItem[];
  total: string;
  orderUrl: string;
  ownerPhone: string | null;
};

export function StandingReminderEmail({
  standingName,
  pickupDateLabel,
  items,
  total,
  orderUrl,
  ownerPhone,
}: StandingReminderEmailProps) {
  return (
    <EmailShell title="AdjanoDeli" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 12px" }}>Zamówić jak zwykle na jutro?</p>
      <p style={{ margin: "0 0 16px", fontWeight: 700 }}>{standingName}</p>
      <p style={{ margin: "0 0 16px" }}>Odbiór: {pickupDateLabel}</p>
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
      <p style={{ margin: "0 0 20px", fontWeight: 700 }}>Suma: {total}</p>
      <p style={{ margin: 0 }}>
        <a
          href={orderUrl}
          style={{
            display: "inline-block",
            backgroundColor: red,
            color: "#ffffff",
            padding: "12px 20px",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Zamawiam
        </a>
      </p>
    </EmailShell>
  );
}
