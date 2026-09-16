import Link from "next/link";
import { notFound } from "next/navigation";

import { DiscountCodeForm } from "@/components/admin/discount-code-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/auth";
import { getOwnerDiscountCode, getOwnerDiscountCodeUses, getOwnerPoints } from "@/lib/admin/owner-queries";
import { formatDatePl } from "@/lib/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DiscountCodeEditPage({ params }: PageProps) {
  const { id } = await params;
  await requireRole("owner", `/admin/kody-rabatowe/${id}`);
  const [code, uses, points] = await Promise.all([
    getOwnerDiscountCode(id),
    getOwnerDiscountCodeUses(id),
    getOwnerPoints(),
  ]);
  if (!code) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <div>
        <PageHeader title={`Kod ${code.code}`} />
        <DiscountCodeForm code={code} points={points} />
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Użycia</h2>
        {uses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nikt jeszcze nie użył tego kodu.</p>
        ) : (
          <>
          <ul className="space-y-3 md:hidden">
            {uses.map((use) => (
              <li
                key={use.id}
                className="space-y-1 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4 text-sm"
              >
                <p className="break-all font-medium">{use.user_email}</p>
                <p className="text-muted-foreground">{formatDatePl(new Date(use.created_at))}</p>
                {use.order_number != null ? (
                  <Link href={`/admin/zamowienia/${use.order_id}`} className="underline underline-offset-4">
                    #{use.order_number}
                  </Link>
                ) : (
                  <p>—</p>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card md:block">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--adj-cream-dark)]">
                  <th className="px-4 py-3 font-medium">Kto</th>
                  <th className="px-4 py-3 font-medium">Kiedy</th>
                  <th className="px-4 py-3 font-medium">Zamówienie</th>
                </tr>
              </thead>
              <tbody>
                {uses.map((use) => (
                  <tr key={use.id} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                    <td className="px-4 py-3">{use.user_email}</td>
                    <td className="px-4 py-3">{formatDatePl(new Date(use.created_at))}</td>
                    <td className="px-4 py-3">
                      {use.order_number != null ? (
                        <Link href={`/admin/zamowienia/${use.order_id}`} className="underline underline-offset-4">
                          #{use.order_number}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </div>
  );
}
