import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { CustomerBanButton } from "@/components/admin/customer-ban-button";
import { PageHeader } from "@/components/admin/page-header";
import { listCustomers, type CustomerRow } from "@/lib/admin/customers";
import { requireRole } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

type SortKey = "name" | "orders" | "spent" | "last";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Imię" },
  { key: "orders", label: "Zamówienia" },
  { key: "spent", label: "Suma" },
  { key: "last", label: "Ostatnie" },
];

function parseSort(value: string | undefined): SortKey {
  if (value === "name" || value === "orders" || value === "spent" || value === "last") {
    return value;
  }
  return "spent";
}

function compare(a: CustomerRow, b: CustomerRow, sort: SortKey): number {
  if (sort === "name") {
    return (a.fullName ?? a.email).localeCompare(b.fullName ?? b.email, "pl");
  }
  if (sort === "orders") {
    return a.orderCount - b.orderCount;
  }
  if (sort === "last") {
    return (a.lastOrderAt ?? "").localeCompare(b.lastOrderAt ?? "");
  }
  return a.spentGrosze - b.spentGrosze;
}

function hrefFor(sort: SortKey, dir: "asc" | "desc"): string {
  return `/admin/klienci?sort=${sort}&dir=${dir}`;
}

function formatWhen(value: string | null): string {
  if (!value) {
    return "—";
  }
  return format(new Date(value), "d MMM yyyy", { locale: pl });
}

function CustomerCells({ row }: { row: CustomerRow }) {
  return (
    <>
      <p className="font-medium">
        {row.fullName?.trim() || "brak imienia"}
        {row.isBanned ? <span className="ml-2 text-[var(--adj-red)]">zablokowane</span> : null}
      </p>
      <p className="text-sm text-muted-foreground">{row.phone ?? "brak telefonu"}</p>
      <p className="text-sm text-muted-foreground">{row.email}</p>
    </>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  await requireRole("owner", "/admin/klienci");
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const dir = params.dir === "asc" ? "asc" : "desc";
  const { rows, error } = await listCustomers();
  const sorted = [...rows].sort((a, b) => {
    const result = compare(a, b, sort);
    return dir === "asc" ? result : -result;
  });

  return (
    <div>
      <PageHeader title="Klienci" />
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Liczą się opłacone zamówienia. Pieczątka jest za zamówienie, nie za sztukę. Po 10
        zamówieniach klient dostaje −30%, najwyżej 40,00 zł.
      </p>
      {error ? <p className="mb-4 text-sm text-[var(--adj-red)]">{error}</p> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {SORTS.map((item) => {
          const nextDir = sort === item.key && dir === "desc" ? "asc" : "desc";
          const active = sort === item.key;
          return (
            <Link
              key={item.key}
              href={hrefFor(item.key, active ? nextDir : item.key === "name" ? "asc" : "desc")}
              className={
                active
                  ? "rounded-full bg-secondary px-3 py-2 text-sm text-secondary-foreground"
                  : "rounded-full border border-[var(--adj-cream-dark)] px-3 py-2 text-sm"
              }
            >
              {item.label}
              {active ? (dir === "asc" ? " ↑" : " ↓") : ""}
            </Link>
          );
        })}
      </div>
      {sorted.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground">Nie ma jeszcze klientów.</p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {sorted.map((row) => (
              <li
                key={row.id}
                className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4"
              >
                <CustomerCells row={row} />
                <p className="text-sm">
                  {row.orderCount} zamówień · {formatPrice(row.spentGrosze)}
                  <br />
                  ostatnie: {formatWhen(row.lastOrderAt)}
                </p>
                <CustomerBanButton id={row.id} banned={row.isBanned} />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--adj-cream-dark)]">
                  <th className="px-4 py-3 font-medium">Klient</th>
                  <th className="px-4 py-3 font-medium">Zamówienia</th>
                  <th className="px-4 py-3 font-medium">Suma</th>
                  <th className="px-4 py-3 font-medium">Ostatnie</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                    <td className="px-4 py-3">
                      <CustomerCells row={row} />
                    </td>
                    <td className="px-4 py-3">{row.orderCount}</td>
                    <td className="px-4 py-3">{formatPrice(row.spentGrosze)}</td>
                    <td className="px-4 py-3">{formatWhen(row.lastOrderAt)}</td>
                    <td className="px-4 py-3">
                      <CustomerBanButton id={row.id} banned={row.isBanned} />
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
