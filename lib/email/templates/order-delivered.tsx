import { EmailShell } from "@/lib/email/templates/shell";

const red = "#A6231F";
const ink = "#2B2A1F";
const soft = "#57553E";
const cream = "#F1EADB";
const textFont = "Georgia, 'Times New Roman', serif";
const labelFont = "'Arial Narrow', Arial, sans-serif";

type OrderDeliveredEmailProps = {
  pickupCode: string;
  detailsUrl: string;
  pointName: string;
  pickupTo: string;
  ownerPhone: string | null;
};

export function OrderDeliveredEmail({
  pickupCode,
  detailsUrl,
  pointName,
  pickupTo,
  ownerPhone,
}: OrderDeliveredEmailProps) {
  return (
    <EmailShell title="AdjanoDeli" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 16px", fontFamily: textFont, fontSize: "22px" }}>
        Twoja paczka czeka
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
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ margin: "0 0 20px" }}
      >
        <tr>
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
            Punkt
          </td>
          <td style={{ padding: "4px 0", color: ink, fontFamily: textFont, fontSize: "16px" }}>
            {pointName}
          </td>
        </tr>
        <tr>
          <td
            style={{
              padding: "4px 12px 4px 0",
              color: soft,
              fontFamily: labelFont,
              fontSize: "13px",
              verticalAlign: "top",
            }}
          >
            Do
          </td>
          <td style={{ padding: "4px 0", color: ink, fontFamily: textFont, fontSize: "16px" }}>
            {pickupTo}
          </td>
        </tr>
      </table>
      <p style={{ margin: 0 }}>
        <a
          href={detailsUrl}
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
          Pokaż QR i szczegóły
        </a>
      </p>
    </EmailShell>
  );
}
