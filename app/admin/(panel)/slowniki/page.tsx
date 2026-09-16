import { DictionariesManager } from "@/components/admin/dictionaries-manager";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/auth";
import { getOwnerAllergens, getOwnerProductTags } from "@/lib/admin/owner-queries";

export default async function DictionariesPage() {
  await requireRole("owner", "/admin/slowniki");
  const [allergens, tags] = await Promise.all([getOwnerAllergens(), getOwnerProductTags()]);

  return (
    <div>
      <PageHeader title="Słowniki" />
      <DictionariesManager allergens={allergens} tags={tags} />
    </div>
  );
}
