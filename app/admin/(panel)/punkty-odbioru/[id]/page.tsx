import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { PickupPointForm } from "@/components/admin/pickup-point-form";
import { requireRole } from "@/lib/auth";
import { getOwnerPoint } from "@/lib/admin/owner-queries";

type PickupPointEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PickupPointEditPage({ params }: PickupPointEditPageProps) {
  const { id } = await params;
  await requireRole("owner", `/admin/punkty-odbioru/${id}`);
  const point = await getOwnerPoint(id);

  if (!point) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={point.name} />
      <PickupPointForm point={point} />
    </div>
  );
}
