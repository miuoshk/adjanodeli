import { EmailShell } from "@/lib/email/templates/shell";

const red = "#A6231F";
const ink = "#2B2A1F";
const cream = "#F1EADB";
const line = "rgba(43,42,31,0.18)";
const textFont = "Georgia, 'Times New Roman', serif";
const labelFont = "'Arial Narrow', Arial, sans-serif";

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
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        {items.map((item) => (
          <tr key={`${item.name}-${item.qty}`}>
            <td
              style={{
                padding: "8px 0",
                borderBottom: `1px solid ${line}`,
                color: ink,
                fontFamily: textFont,
                fontSize: "16px",
              }}
            >
              {item.name} × {item.qty}
            </td>
            <td
              style={{
                padding: "8px 0",
                borderBottom: `1px solid ${line}`,
                color: ink,
                fontFamily: labelFont,
                fontSize: "16px",
                textAlign: "right",
              }}
            >
              {item.lineTotal}
            </td>
          </tr>
        ))}
      </table>
      <p style={{ margin: "12px 0 20px", fontWeight: 700, fontSize: "18px" }}>Suma: {total}</p>
      <p style={{ margin: 0 }}>
        <a
          href={orderUrl}
          style={{
            display: "inline-block",
            backgroundColor: red,
            color: cream,
            padding: "14px 22px",
            borderRadius: "6px",
            textDecoration: "none",
            fontFamily: labelFont,
            fontSize: "16px",
          }}
        >
          Zamawiam
        </a>
      </p>
    </EmailShell>
  );
}
