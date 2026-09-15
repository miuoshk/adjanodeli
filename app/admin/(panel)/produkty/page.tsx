import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { ProductActiveSwitch } from "@/components/admin/product-active-switch";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getOwnerProductList } from "@/lib/admin/owner-queries";
import { formatPrice } from "@/lib/format";
import { productPublicUrl } from "@/lib/products/image";

export default async function OwnerProductsPage() {
  await requireRole("owner", "/admin/produkty");
  const products = await getOwnerProductList();

  const groups: { name: string; products: typeof products }[] = [];
  const sorted = [...products].sort((a, b) => {
    if (a.categorySort !== b.categorySort) {
      return a.categorySort - b.categorySort;
    }
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.name.localeCompare(b.name, "pl");
  });
  for (const product of sorted) {
    const last = groups[groups.length - 1];
    if (!last || last.name !== product.categoryName) {
      groups.push({ name: product.categoryName, products: [product] });
    } else {
      last.products.push(product);
    }
  }

  return (
    <div>
      <PageHeader title="Produkty">
        <Button asChild className="min-h-12">
          <Link href="/admin/produkty/nowy">Nowy produkt</Link>
        </Button>
      </PageHeader>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie ma jeszcze produktów.</p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.name} className="space-y-3">
              <h2 className="text-2xl font-semibold">{group.name}</h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--adj-cream-dark)]">
                      <th className="px-4 py-3 font-medium">Zdjęcie</th>
                      <th className="px-4 py-3 font-medium">Nazwa</th>
                      <th className="px-4 py-3 font-medium">Cena</th>
                      <th className="px-4 py-3 font-medium">Limit</th>
                      <th className="px-4 py-3 font-medium">Aktywny</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.products.map((product) => {
                      const imageUrl = productPublicUrl(product.image_path);
                      return (
                        <tr key={product.id} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                          <td className="px-4 py-3">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt=""
                                width={48}
                                height={48}
                                className="size-12 rounded-md object-cover"
                              />
                            ) : (
                              <span className="block size-12 rounded-md bg-[var(--adj-cream)]" />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3">{formatPrice(product.price_grosze)}</td>
                          <td className="px-4 py-3">{product.daily_cap_default}</td>
                          <td className="px-4 py-3">
                            <ProductActiveSwitch id={product.id} isActive={product.is_active} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button asChild variant="outline" className="min-h-10">
                              <Link href={`/admin/produkty/${product.id}`}>Edytuj</Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
