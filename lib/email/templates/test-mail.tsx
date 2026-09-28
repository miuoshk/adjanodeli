import { EmailShell } from "@/lib/email/templates/shell";

type TestMailProps = {
  ownerPhone: string | null;
};

export function TestMail({ ownerPhone }: TestMailProps) {
  return (
    <EmailShell title="Test poczty" ownerPhone={ownerPhone}>
      <p style={{ margin: 0 }}>To jest testowy mail z panelu. Poczta działa.</p>
    </EmailShell>
  );
}
