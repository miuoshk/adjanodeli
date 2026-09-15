import { parseDateOnly, warsawDateIso } from "@/lib/dates";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type OwnerCategory = Pick<Tables<"categories">, "id" | "name" | "sort_order">;
export type OwnerProduct = Tables<"products">;
export type OwnerPickupPoint = Tables<"pickup_points">;
export type OwnerSettings = Tables<"settings">;

export type OwnerProductListItem = OwnerProduct & {
  categoryName: string;
  categorySort: number;
};

export async function getOwnerCategories(): Promise<OwnerCategory[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order");
  return data ?? [];
}

export async function getOwnerProductList(): Promise<OwnerProductListItem[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(name, sort_order)")
    .order("sort_order");

  type Row = OwnerProduct & {
    categories: { name: string; sort_order: number | null } | { name: string; sort_order: number | null }[] | null;
  };

  return ((data ?? []) as Row[]).map((row) => {
    const category = Array.isArray(row.categories) ? (row.categories[0] ?? null) : row.categories;
    const product = row as OwnerProduct;
    return {
      ...product,
      categoryName: category?.name ?? "Bez kategorii",
      categorySort: category?.sort_order ?? 999,
    };
  });
}

export async function getOwnerProduct(id: string): Promise<OwnerProduct | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getOwnerPoints(): Promise<OwnerPickupPoint[]> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("pickup_points").select("*").order("sort_order");
  return data ?? [];
}

export async function getOwnerPoint(id: string): Promise<OwnerPickupPoint | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("pickup_points").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getOwnerSettings(): Promise<OwnerSettings | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseDateOnly(iso);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekDatesFrom(from: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysIso(from, index));
}

export async function getDefaultLimitsFrom(): Promise<string> {
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("available_pickup_dates");
  const first = data?.[0];
  return first ? first.slice(0, 10) : warsawDateIso(0);
}

export type LimitCell = {
  productId: string;
  day: string;
  defaultCap: number;
  effectiveCap: number;
  reserved: number;
  isAvailable: boolean;
  hasOverride: boolean;
  overrideCap: number | null;
};

export type LimitsGrid = {
  from: string;
  days: string[];
  products: { id: string; name: string; categoryName: string; dailyCapDefault: number }[];
  cells: Record<string, LimitCell>;
};

export async function getLimitsGrid(from: string): Promise<LimitsGrid> {
  const supabase = await createServerClient();
  const days = weekDatesFrom(from);
  const to = days[6];

  const [productsResult, overridesResult, stockResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, daily_cap_default, sort_order, category_id, categories(name, sort_order)")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("product_day_overrides")
      .select("product_id, day, cap, is_available")
      .gte("day", from)
      .lte("day", to),
    supabase
      .from("daily_stock")
      .select("product_id, day, reserved_qty")
      .gte("day", from)
      .lte("day", to),
  ]);

  type CategoryJoin = { name: string; sort_order: number | null };
  const products = ((productsResult.data ?? []) as {
    id: string;
    name: string;
    daily_cap_default: number;
    sort_order: number;
    category_id: string | null;
    categories: CategoryJoin | CategoryJoin[] | null;
  }[])
    .map((product) => {
      const category = Array.isArray(product.categories)
        ? (product.categories[0] ?? null)
        : product.categories;
      return {
        id: product.id,
        name: product.name,
        categoryName: category?.name ?? "Bez kategorii",
        categorySort: category?.sort_order ?? 999,
        productSort: product.sort_order,
        dailyCapDefault: product.daily_cap_default,
      };
    })
    .sort((a, b) => {
      if (a.categorySort !== b.categorySort) {
        return a.categorySort - b.categorySort;
      }
      return a.productSort - b.productSort;
    });

  const overrides = new Map(
    (overridesResult.data ?? []).map((row) => [
      `${row.product_id}:${row.day.slice(0, 10)}`,
      row,
    ]),
  );
  const reserved = new Map(
    (stockResult.data ?? []).map((row) => [
      `${row.product_id}:${row.day.slice(0, 10)}`,
      row.reserved_qty,
    ]),
  );

  const cells: Record<string, LimitCell> = {};
  for (const product of products) {
    for (const day of days) {
      const key = `${product.id}:${day}`;
      const override = overrides.get(key);
      const overrideCap = override?.cap ?? null;
      cells[key] = {
        productId: product.id,
        day,
        defaultCap: product.dailyCapDefault,
        effectiveCap: overrideCap ?? product.dailyCapDefault,
        reserved: reserved.get(key) ?? 0,
        isAvailable: override?.is_available ?? true,
        hasOverride: Boolean(override),
        overrideCap,
      };
    }
  }

  return {
    from,
    days,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      categoryName: product.categoryName,
      dailyCapDefault: product.dailyCapDefault,
    })),
    cells,
  };
}
