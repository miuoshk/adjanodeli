import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireRole } from "@/lib/auth";
import { getOwnerCategories, getOwnerProduct } from "@/lib/admin/owner-queries";

type ProductEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  await requireRole("owner", `/admin/produkty/${id}`);
  const [product, categories] = await Promise.all([getOwnerProduct(id), getOwnerCategories()]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={product.name} />
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
