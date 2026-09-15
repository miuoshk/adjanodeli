import { EmailShell } from "@/lib/email/templates/shell";

type SpecialRequestOwnerEmailProps = {
  name: string | null;
  phone: string | null;
  email: string | null;
  wantedDateLabel: string | null;
  description: string;
  ownerPhone: string | null;
};

export function SpecialRequestOwnerEmail({
  name,
  phone,
  email,
  wantedDateLabel,
  description,
  ownerPhone,
}: SpecialRequestOwnerEmailProps) {
  return (
    <EmailShell title="AdjanoDeli" ownerPhone={ownerPhone}>
      <p style={{ margin: "0 0 16px", fontWeight: 700 }}>Nowe zamówienie specjalne</p>
      {name ? <p style={{ margin: "0 0 4px" }}>{name}</p> : null}
      {phone ? <p style={{ margin: "0 0 4px" }}>Tel. {phone}</p> : null}
      {email ? <p style={{ margin: "0 0 4px" }}>{email}</p> : null}
      {wantedDateLabel ? <p style={{ margin: "0 0 12px" }}>Na dzień: {wantedDateLabel}</p> : null}
      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{description}</p>
    </EmailShell>
  );
}
