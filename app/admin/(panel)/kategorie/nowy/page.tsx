import { PageHeader } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { requireRole } from "@/lib/auth";

export default async function NewCategoryPage() {
  await requireRole("owner", "/admin/kategorie/nowy");

  return (
    <div>
      <PageHeader title="Nowa kategoria" />
      <CategoryForm />
    </div>
  );
}
