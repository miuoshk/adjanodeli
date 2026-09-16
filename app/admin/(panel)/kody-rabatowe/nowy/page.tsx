import { DiscountCodeForm } from "@/components/admin/discount-code-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/auth";
import { getOwnerPoints } from "@/lib/admin/owner-queries";

export default async function NewDiscountCodePage() {
  await requireRole("owner", "/admin/kody-rabatowe/nowy");
  const points = await getOwnerPoints();

  return (
    <div>
      <PageHeader title="Nowy kod rabatowy" />
      <DiscountCodeForm points={points} />
    </div>
  );
}
