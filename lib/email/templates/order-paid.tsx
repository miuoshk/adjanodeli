import { EmailShell } from "@/lib/email/templates/shell";

const red = "#C4161C";
const ink = "#2B2A1F";
const soft = "#57553E";
const cream = "#F1EADB";
const line = "rgba(43,42,31,0.18)";
const textFont = "Georgia, 'Times New Roman', serif";
const labelFont = "'Arial Narrow', Arial, sans-serif";

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
  stampsLine: string;
  newVoucherLine: string | null;
};

const buttonStyle = {
  display: "inline-block",
  backgroundColor: red,
  color: cream,
  padding: "14px 22px",
  borderRadius: "6px",
  textDecoration: "none",
  fontFamily: labelFont,
  fontSize: "16px",
} as const;

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
  stampsLine,
  newVoucherLine,
}: OrderPaidEmailProps) {
  const facts = [
    ["Punkt", pointName],
    ["Adres", pointAddress],
    ["Dzień", pickupDateLabel],
    ["Godziny", timeRange],
  ];

  return (
    <EmailShell title="AdjanoDeli" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 16px", fontFamily: textFont, fontSize: "22px" }}>
        Zamówienie #{orderNumber} jest opłacone.
      </p>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ margin: "0 0 20px", border: `1px dashed ${red}` }}
      >
        <tr>
          <td style={{ padding: "18px", textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 8px",
                color: soft,
                fontFamily: labelFont,
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Kod odbioru
            </p>
            <p
              style={{
                margin: 0,
                color: red,
                fontFamily: labelFont,
                fontSize: "48px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                lineHeight: 1.1,
              }}
            >
              {pickupCode}
            </p>
          </td>
        </tr>
      </table>
      <p style={{ margin: "0 0 20px" }}>
        <a href={detailsUrl} style={buttonStyle}>
          Pokaż QR i szczegóły
        </a>
      </p>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ margin: "0 0 20px" }}
      >
        {facts.map(([label, value]) => (
          <tr key={label}>
            <td
              style={{
                padding: "4px 12px 4px 0",
                color: soft,
                fontFamily: labelFont,
                fontSize: "13px",
                verticalAlign: "top",
                width: "90px",
              }}
            >
              {label}
            </td>
            <td
              style={{
                padding: "4px 0",
                color: ink,
                fontFamily: textFont,
                fontSize: "16px",
                verticalAlign: "top",
              }}
            >
              {value}
            </td>
          </tr>
        ))}
      </table>
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
      <p style={{ margin: "12px 0 0", fontWeight: 700, fontSize: "18px" }}>Suma: {total}</p>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: "16px" }}>
        <tr>
          <td style={{ borderLeft: `3px solid ${red}`, paddingLeft: "12px" }}>
            <p style={{ margin: 0 }}>{stampsLine}</p>
            {newVoucherLine ? <p style={{ margin: "8px 0 0" }}>{newVoucherLine}</p> : null}
          </td>
        </tr>
      </table>
    </EmailShell>
  );
}
