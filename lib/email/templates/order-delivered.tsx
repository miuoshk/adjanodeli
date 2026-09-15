import { EmailShell } from "@/lib/email/templates/shell";

const red = "#C4161C";

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
      <p style={{ margin: "0 0 16px" }}>Twoja paczka czeka w {pointName}.</p>
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
      <p style={{ margin: "0 0 16px" }}>Do {pickupTo}.</p>
      <p style={{ margin: 0 }}>
        <a href={detailsUrl} style={{ color: red }}>
          Pokaż QR i szczegóły
        </a>
      </p>
    </EmailShell>
  );
}
