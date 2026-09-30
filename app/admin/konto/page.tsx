import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/auth";

export default async function AccountPage() {
  const profile = await requireRole("staff", "/admin/konto");

  return (
    <div className="space-y-6">
      <PageHeader title="Zmień hasło" />
      <ChangePasswordForm mustChange={profile.must_change_password} />
    </div>
  );
}
