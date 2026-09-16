import Link from "next/link";

import { CopyCodeButton } from "@/components/admin/copy-code-button";
import { DiscountCodeActiveSwitch } from "@/components/admin/discount-code-active-switch";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getOwnerDiscountCodes } from "@/lib/admin/owner-queries";
import { formatPrice } from "@/lib/format";

function valueLabel(type: string, value: number): string {
  if (type === "percent") {
    return `${value}%`;
  }
  return formatPrice(value);
}

function validityLabel(from: string | null, to: string | null): string {
  const start = from ? from.slice(0, 10) : null;
  const end = to ? to.slice(0, 10) : null;
  if (!start && !end) {
    return "bez limitu";
  }
  if (start && end) {
    return `${start} – ${end}`;
  }
  if (start) {
    return `od ${start}`;
  }
  return `do ${end}`;
}

export default async function DiscountCodesPage() {
  await requireRole("owner", "/admin/kody-rabatowe");
  const codes = await getOwnerDiscountCodes();

  return (
    <div>
      <PageHeader title="Kody rabatowe">
        <Button asChild className="min-h-12">
          <Link href="/admin/kody-rabatowe/nowy">Nowy kod</Link>
        </Button>
      </PageHeader>

      {codes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie ma jeszcze kodów.</p>
      ) : (
        <>
        <ul className="space-y-3 md:hidden">
          {codes.map((row) => (
            <li
              key={row.id}
              className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4"
            >
              <p className="font-medium">{row.code}</p>
              <p className="text-sm text-muted-foreground">
                {row.type === "percent" ? "procent" : "kwota"} {valueLabel(row.type, row.value)} ·{" "}
                {row.uses_count}/{row.max_uses ?? "∞"} · {validityLabel(row.valid_from, row.valid_to)}
              </p>
              <DiscountCodeActiveSwitch id={row.id} isActive={row.is_active} />
              <div className="flex flex-col gap-2">
                <CopyCodeButton code={row.code} />
                <Button asChild variant="outline" className="min-h-12 w-full">
                  <Link href={`/admin/kody-rabatowe/${row.id}`}>Edytuj</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--adj-cream-dark)]">
                <th className="px-4 py-3 font-medium">Kod</th>
                <th className="px-4 py-3 font-medium">Typ</th>
                <th className="px-4 py-3 font-medium">Wartość</th>
                <th className="px-4 py-3 font-medium">Użycia</th>
                <th className="px-4 py-3 font-medium">Ważność</th>
                <th className="px-4 py-3 font-medium">Aktywny</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {codes.map((row) => (
                <tr key={row.id} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                  <td className="px-4 py-3 font-medium">{row.code}</td>
                  <td className="px-4 py-3">{row.type === "percent" ? "procent" : "kwota"}</td>
                  <td className="px-4 py-3">{valueLabel(row.type, row.value)}</td>
                  <td className="px-4 py-3">
                    {row.uses_count}/{row.max_uses ?? "∞"}
                  </td>
                  <td className="px-4 py-3">{validityLabel(row.valid_from, row.valid_to)}</td>
                  <td className="px-4 py-3">
                    <DiscountCodeActiveSwitch id={row.id} isActive={row.is_active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <CopyCodeButton code={row.code} />
                      <Button asChild variant="outline" className="min-h-10">
                        <Link href={`/admin/kody-rabatowe/${row.id}`}>Edytuj</Link>
                      </Button>
                    </div>
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
