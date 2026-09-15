import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireRole } from "@/lib/auth";
import { getOwnerCategories } from "@/lib/admin/owner-queries";

export default async function NewProductPage() {
  await requireRole("owner", "/admin/produkty/nowy");
  const categories = await getOwnerCategories();

  return (
    <div>
      <PageHeader title="Nowy produkt" />
      <ProductForm categories={categories} />
    </div>
  );
}
