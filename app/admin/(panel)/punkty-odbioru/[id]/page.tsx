import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { PickupPointAccessPanel } from "@/components/admin/pickup-point-access-panel";
import { PickupPointForm } from "@/components/admin/pickup-point-form";
import { requireRole } from "@/lib/auth";
import { getOwnerPoint, getOwnerPointAccesses } from "@/lib/admin/owner-queries";

type PickupPointEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PickupPointEditPage({ params }: PickupPointEditPageProps) {
  const { id } = await params;
  await requireRole("owner", `/admin/punkty-odbioru/${id}`);
  const [point, accesses] = await Promise.all([getOwnerPoint(id), getOwnerPointAccesses(id)]);

  if (!point) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={point.name} />
      <PickupPointForm point={point} />
      <PickupPointAccessPanel pointId={point.id} accesses={accesses} />
    </div>
  );
}
