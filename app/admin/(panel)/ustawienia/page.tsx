import { EmailLogList } from "@/components/admin/email-log-list";
import { PageHeader } from "@/components/admin/page-header";
import { SendTestMailButton } from "@/components/admin/send-test-mail-button";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireRole } from "@/lib/auth";
import { getOwnerSettings } from "@/lib/admin/owner-queries";
import { getRecentEmailLog } from "@/lib/admin/queries";

export default async function SettingsPage() {
  await requireRole("owner", "/admin/ustawienia");
  const [settings, recentMails] = await Promise.all([getOwnerSettings(), getRecentEmailLog(10)]);

  if (!settings) {
    return <p>Brak ustawień w bazie.</p>;
  }

  const emailFrom = process.env.EMAIL_FROM ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="space-y-10">
      <PageHeader title="Ustawienia" />
      <section className="space-y-4 rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-4">
        <h2 className="text-2xl font-semibold">Poczta i płatności</h2>
        <ul className="space-y-1 text-sm leading-relaxed">
          <li>RESEND_API_KEY: {process.env.RESEND_API_KEY ? "ustawiony" : "brak"}</li>
          <li>STRIPE_WEBHOOK_SECRET: {process.env.STRIPE_WEBHOOK_SECRET ? "ustawiony" : "brak"}</li>
          <li>EMAIL_FROM: {emailFrom || "brak"}</li>
          <li>NEXT_PUBLIC_APP_URL: {appUrl || "brak"}</li>
        </ul>
        <SendTestMailButton />
        <EmailLogList rows={recentMails} />
      </section>
      <SettingsForm settings={settings} />
    </div>
  );
}
