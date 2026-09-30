import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireRole } from "@/lib/auth";
import {
  getOwnerCategories,
  getOwnerDictionaryOptions,
  getOwnerProduct,
  getOwnerProductOptionGroups,
} from "@/lib/admin/owner-queries";

type ProductEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  await requireRole("owner", `/admin/produkty/${id}`);
  const [product, categories, dictionaries, optionGroups] = await Promise.all([
    getOwnerProduct(id),
    getOwnerCategories(),
    getOwnerDictionaryOptions(),
    getOwnerProductOptionGroups(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={product.name} />
      <ProductForm
        categories={categories}
        allergens={dictionaries.allergens}
        tags={dictionaries.tags}
        product={product}
        optionGroups={optionGroups}
      />
    </div>
  );
}
