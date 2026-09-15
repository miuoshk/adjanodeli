import { Fragment } from "react";

import type { ProductionData } from "@/lib/admin/queries";

type ProductionTableProps = {
  data: ProductionData;
  variant: "screen" | "print";
};

function groupRows(data: ProductionData) {
  const groups: { name: string; rows: ProductionData["rows"] }[] = [];
  for (const row of data.rows) {
    const last = groups[groups.length - 1];
    if (!last || last.name !== row.categoryName) {
      groups.push({ name: row.categoryName, rows: [row] });
    } else {
      last.rows.push(row);
    }
  }
  return groups;
}

function totalsOf(data: ProductionData) {
  const byPoint: Record<string, number> = {};
  let total = 0;
  for (const name of data.pointNames) {
    byPoint[name] = 0;
  }
  for (const row of data.rows) {
    total += row.totalQty;
    for (const name of data.pointNames) {
      byPoint[name] += row.byPoint[name] ?? 0;
    }
  }
  return { total, byPoint };
}

export function ProductionTable({ data, variant }: ProductionTableProps) {
  const groups = groupRows(data);
  const totals = totalsOf(data);
  const isPrint = variant === "print";

  if (data.rows.length === 0) {
    return <p className={isPrint ? "print-empty" : "text-sm text-muted-foreground"}>Brak zamówień na ten dzień.</p>;
  }

  return (
    <div className={isPrint ? undefined : "overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card"}>
      <table className={isPrint ? "production-print-table" : "w-full min-w-[640px] text-left text-sm"}>
        <thead>
          <tr className={isPrint ? undefined : "border-b border-[var(--adj-cream-dark)]"}>
            <th className={isPrint ? undefined : "px-4 py-3 font-medium"}>Produkt</th>
            <th className={isPrint ? "num" : "px-4 py-3 font-medium text-right"}>Razem</th>
            {data.pointNames.map((name) => (
              <th key={name} className={isPrint ? "num" : "px-4 py-3 font-medium text-right"}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.name}>
              <tr className={isPrint ? "category-row print-block" : "bg-[var(--adj-cream)]"}>
                <th
                  colSpan={2 + data.pointNames.length}
                  className={isPrint ? undefined : "px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"}
                >
                  {group.name}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.productId} className={isPrint ? "print-block" : "border-b border-[var(--adj-cream-dark)]"}>
                  <td className={isPrint ? undefined : "px-4 py-3"}>{row.productName}</td>
                  <td className={isPrint ? "num" : "px-4 py-3 text-right font-medium"}>{row.totalQty}</td>
                  {data.pointNames.map((name) => (
                    <td key={name} className={isPrint ? "num" : "px-4 py-3 text-right"}>
                      {row.byPoint[name] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
          <tr className={isPrint ? "sum-row print-block" : "border-t-2 border-[var(--adj-ink)] font-semibold"}>
            <td className={isPrint ? undefined : "px-4 py-3"}>Suma</td>
            <td className={isPrint ? "num" : "px-4 py-3 text-right"}>{totals.total}</td>
            {data.pointNames.map((name) => (
              <td key={name} className={isPrint ? "num" : "px-4 py-3 text-right"}>
                {totals.byPoint[name] ?? 0}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
