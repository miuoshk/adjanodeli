import { PageHeader } from "@/components/admin/page-header";
import { PickupPointForm } from "@/components/admin/pickup-point-form";
import { requireRole } from "@/lib/auth";

export default async function NewPickupPointPage() {
  await requireRole("owner", "/admin/punkty-odbioru/nowy");

  return (
    <div>
      <PageHeader title="Nowy punkt" />
      <PickupPointForm />
    </div>
  );
}
