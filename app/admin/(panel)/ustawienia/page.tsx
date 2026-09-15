import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireRole } from "@/lib/auth";
import { getOwnerSettings } from "@/lib/admin/owner-queries";

export default async function SettingsPage() {
  await requireRole("owner", "/admin/ustawienia");
  const settings = await getOwnerSettings();

  if (!settings) {
    return <p>Brak ustawień w bazie.</p>;
  }

  return (
    <div>
      <PageHeader title="Ustawienia" />
      <SettingsForm settings={settings} />
    </div>
  );
}
