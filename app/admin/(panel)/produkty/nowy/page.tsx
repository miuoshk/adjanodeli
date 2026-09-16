import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireRole } from "@/lib/auth";
import { getOwnerCategories, getOwnerDictionaryOptions } from "@/lib/admin/owner-queries";

export default async function NewProductPage() {
  await requireRole("owner", "/admin/produkty/nowy");
  const [categories, dictionaries] = await Promise.all([
    getOwnerCategories(),
    getOwnerDictionaryOptions(),
  ]);

  return (
    <div>
      <PageHeader title="Nowy produkt" />
      <ProductForm
        categories={categories}
        allergens={dictionaries.allergens}
        tags={dictionaries.tags}
      />
    </div>
  );
}
