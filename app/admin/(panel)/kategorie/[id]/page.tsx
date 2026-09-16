import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/auth";
import { getOwnerCategory } from "@/lib/admin/owner-queries";

type CategoryEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CategoryEditPage({ params }: CategoryEditPageProps) {
  const { id } = await params;
  await requireRole("owner", `/admin/kategorie/${id}`);
  const category = await getOwnerCategory(id);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={category.name} />
      <CategoryForm category={category} productCount={category.productCount} />
    </div>
  );
}
