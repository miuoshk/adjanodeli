import { EmailShell } from "@/lib/email/templates/shell";

const ink = "#2B2A1F";
const soft = "#57553E";
const textFont = "Georgia, 'Times New Roman', serif";
const labelFont = "'Arial Narrow', Arial, sans-serif";

type PickupPointChangedEmailProps = {
  pointName: string;
  pointAddress: string | null;
  pickupHours: string;
  pickupCode: string;
  ownerPhone: string | null;
};

export function PickupPointChangedEmail({
  pointName,
  pointAddress,
  pickupHours,
  pickupCode,
  ownerPhone,
}: PickupPointChangedEmailProps) {
  return (
    <EmailShell title="Nowy punkt odbioru" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 16px", fontFamily: textFont, fontSize: "22px" }}>
        Zmieniliśmy punkt odbioru
      </p>
      <p style={{ margin: "0 0 8px", color: ink, fontFamily: textFont, fontSize: "17px" }}>
        {pointName}
      </p>
      {pointAddress ? (
        <p style={{ margin: "0 0 8px", color: soft, fontFamily: textFont, fontSize: "16px" }}>
          {pointAddress}
        </p>
      ) : null}
      <p style={{ margin: "0 0 16px", color: ink, fontFamily: textFont, fontSize: "16px" }}>
        Odbiór {pickupHours}
      </p>
      <p
        style={{
          margin: 0,
          color: soft,
          fontFamily: labelFont,
          fontSize: "13px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Kod odbioru
      </p>
      <p
        style={{
          margin: "6px 0 0",
          color: ink,
          fontFamily: labelFont,
          fontSize: "32px",
          fontWeight: 700,
          letterSpacing: "0.16em",
        }}
      >
        {pickupCode}
      </p>
    </EmailShell>
  );
}
