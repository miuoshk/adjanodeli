import type { Json } from "@/lib/supabase/database.types";

export type ProductionRow = {
  productId: string;
  productName: string;
  categoryName: string;
  categorySort: number;
  productSort: number;
  totalQty: number;
  byPoint: Record<string, number>;
  optionBreakdown: string;
};

export type ProductionSummaryInput = {
  product_id: string;
  product_name: string;
  total_qty: number;
  by_point: Json;
  by_option: Json | null;
};

export type ProductionProductMeta = {
  id: string;
  sort_order: number;
  categoryName: string;
  categorySort: number;
};

export function optionBreakdown(value: Json | null): string {
  if (!Array.isArray(value)) {
    return "";
  }
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return "";
      }
      const label = "label" in entry ? entry.label : null;
      const qty = "qty" in entry ? entry.qty : null;
      if (typeof label !== "string" || typeof qty !== "number" || qty <= 0) {
        return "";
      }
      return `${label} ${qty}`;
    })
    .filter(Boolean)
    .join(" · ");
}

function asByPoint(value: Json | null): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, qty] of Object.entries(value)) {
    if (typeof qty === "number") {
      result[key] = qty;
    }
  }
  return result;
}

export function buildProductionRows(
  summary: ProductionSummaryInput[],
  products: ProductionProductMeta[],
): ProductionRow[] {
  const meta = new Map(
    products.map((product) => [product.id, product] as const),
  );

  const rows: ProductionRow[] = summary.map((row) => {
    const info = meta.get(row.product_id);
    return {
      productId: row.product_id,
      productName: row.product_name,
      categoryName: info?.categoryName ?? "Inne",
      categorySort: info?.categorySort ?? 999,
      productSort: info?.sort_order ?? 999,
      totalQty: row.total_qty,
      byPoint: asByPoint(row.by_point),
      optionBreakdown: optionBreakdown(row.by_option),
    };
  });

  rows.sort((a, b) => {
    if (a.categorySort !== b.categorySort) {
      return a.categorySort - b.categorySort;
    }
    if (a.categoryName !== b.categoryName) {
      return a.categoryName.localeCompare(b.categoryName, "pl");
    }
    if (a.productSort !== b.productSort) {
      return a.productSort - b.productSort;
    }
    return a.productName.localeCompare(b.productName, "pl");
  });

  return rows;
}
