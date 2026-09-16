import Link from "next/link";

import { CategoryActiveSwitch } from "@/components/admin/category-active-switch";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getOwnerCategoryList } from "@/lib/admin/owner-queries";

export default async function OwnerCategoriesPage() {
  await requireRole("owner", "/admin/kategorie");
  const categories = await getOwnerCategoryList();

  return (
    <div>
      <PageHeader title="Kategorie">
        <Button asChild className="min-h-12">
          <Link href="/admin/kategorie/nowy">Nowa kategoria</Link>
        </Button>
      </PageHeader>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie ma jeszcze kategorii.</p>
      ) : (
        <>
        <ul className="space-y-3 md:hidden">
          {categories.map((category) => (
            <li
              key={category.id}
              className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4"
            >
              <p className="font-medium">{category.name}</p>
              <p className="text-sm text-muted-foreground">
                {category.productCount} prod. · odbiór za {category.lead_days} · kol. {category.sort_order ?? 0}
              </p>
              <CategoryActiveSwitch id={category.id} isActive={category.is_active ?? true} />
              <Button asChild variant="outline" className="min-h-12 w-full">
                <Link href={`/admin/kategorie/${category.id}`}>Edytuj</Link>
              </Button>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--adj-cream-dark)]">
                <th className="px-4 py-3 font-medium">Kolejność</th>
                <th className="px-4 py-3 font-medium">Nazwa</th>
                <th className="px-4 py-3 font-medium">Produkty</th>
                <th className="px-4 py-3 font-medium">Aktywna</th>
                <th className="px-4 py-3 font-medium">Odbiór za</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                  <td className="px-4 py-3">{category.sort_order ?? 0}</td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3">{category.productCount}</td>
                  <td className="px-4 py-3">
                    <CategoryActiveSwitch id={category.id} isActive={category.is_active ?? true} />
                  </td>
                  <td className="px-4 py-3">{category.lead_days}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="outline" className="min-h-10">
                      <Link href={`/admin/kategorie/${category.id}`}>Edytuj</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
