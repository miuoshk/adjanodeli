import { EmailShell } from "@/lib/email/templates/shell";

const red = "#A6231F";
const cream = "#F1EADB";
const ink = "#2B2A1F";
const soft = "#57553E";
const textFont = "Georgia, 'Times New Roman', serif";
const labelFont = "'Arial Narrow', Arial, sans-serif";

type DailyReminderEmailProps = {
  intro: string;
  shopUrl: string;
  unsubscribeUrl: string;
  ownerPhone: string | null;
};

export function DailyReminderEmail({
  intro,
  shopUrl,
  unsubscribeUrl,
  ownerPhone,
}: DailyReminderEmailProps) {
  return (
    <EmailShell title="Zamówienie na jutro" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 20px", fontFamily: textFont, fontSize: "18px", color: ink }}>{intro}</p>
      <p style={{ margin: "0 0 28px" }}>
        <a
          href={shopUrl}
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
          Zamów na jutro
        </a>
      </p>
      <p style={{ margin: 0, color: soft, fontSize: "14px" }}>
        Nie chcesz tych przypomnień?{" "}
        <a href={unsubscribeUrl} style={{ color: ink }}>
          Wyłącz je jednym kliknięciem
        </a>
        .
      </p>
    </EmailShell>
  );
}
