import { isoWeekday, parseDateOnly, warsawDateIso } from "@/lib/dates";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type OwnerCategory = Pick<Tables<"categories">, "id" | "name" | "sort_order">;
export type OwnerCategoryRecord = Tables<"categories">;
export type OwnerCategoryListItem = OwnerCategoryRecord & { productCount: number };
export type OwnerProduct = Tables<"products">;
export type OwnerPickupPoint = Tables<"pickup_points">;
export type OwnerPickupPointListItem = OwnerPickupPoint & { unlockCount: number };
export type OwnerPointAccess = {
  userId: string;
  fullName: string | null;
  email: string;
  grantedVia: "code" | "domain" | "admin";
  grantedAt: string;
};
export type OwnerDiscountCode = Tables<"discount_codes">;
export type OwnerDiscountCodeUse = {
  id: string;
  created_at: string;
  user_email: string;
  order_number: number | null;
  order_id: string;
};
export type OwnerSettings = Tables<"settings">;
export type OwnerAllergen = Tables<"allergens"> & { productCount: number };
export type OwnerProductTag = Tables<"product_tags"> & { productCount: number };
export type OwnerDictionaryOption = { name: string; is_active: boolean };

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

export async function getOwnerCategoryList(): Promise<OwnerCategoryListItem[]> {
  const supabase = await createServerClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("category_id"),
  ]);

  const counts = new Map<string, number>();
  for (const product of products ?? []) {
    if (!product.category_id) {
      continue;
    }
    counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
  }

  return (categories ?? []).map((category) => ({
    ...category,
    productCount: counts.get(category.id) ?? 0,
  }));
}

export async function getOwnerCategory(id: string): Promise<OwnerCategoryListItem | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (!data) {
    return null;
  }
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  return { ...data, productCount: count ?? 0 };
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

function countNameUse(values: string[][], name: string): number {
  return values.reduce((total, list) => total + (list.includes(name) ? 1 : 0), 0);
}

export async function getOwnerAllergens(): Promise<OwnerAllergen[]> {
  const supabase = await createServerClient();
  const [{ data: allergens }, { data: products }] = await Promise.all([
    supabase.from("allergens").select("*").order("sort_order").order("name"),
    supabase.from("products").select("allergens"),
  ]);
  const lists = (products ?? []).map((row) => row.allergens);
  return (allergens ?? []).map((row) => ({
    ...row,
    productCount: countNameUse(lists, row.name),
  }));
}

export async function getOwnerProductTags(): Promise<OwnerProductTag[]> {
  const supabase = await createServerClient();
  const [{ data: tags }, { data: products }] = await Promise.all([
    supabase.from("product_tags").select("*").order("sort_order").order("name"),
    supabase.from("products").select("tags"),
  ]);
  const lists = (products ?? []).map((row) => row.tags);
  return (tags ?? []).map((row) => ({
    ...row,
    productCount: countNameUse(lists, row.name),
  }));
}

export async function getOwnerDictionaryOptions(): Promise<{
  allergens: OwnerDictionaryOption[];
  tags: OwnerDictionaryOption[];
}> {
  const supabase = await createServerClient();
  const [allergensResult, tagsResult] = await Promise.all([
    supabase.from("allergens").select("name, is_active").order("sort_order").order("name"),
    supabase.from("product_tags").select("name, is_active").order("sort_order").order("name"),
  ]);
  return {
    allergens: allergensResult.data ?? [],
    tags: tagsResult.data ?? [],
  };
}

export async function getOwnerPoints(): Promise<OwnerPickupPointListItem[]> {
  const supabase = await createServerClient();
  const [pointsResult, accessResult] = await Promise.all([
    supabase.from("pickup_points").select("*").order("sort_order"),
    supabase.from("pickup_point_access").select("pickup_point_id, granted_via"),
  ]);
  const counts = new Map<string, number>();
  for (const row of accessResult.data ?? []) {
    if (row.granted_via === "code") {
      counts.set(row.pickup_point_id, (counts.get(row.pickup_point_id) ?? 0) + 1);
    }
  }
  return (pointsResult.data ?? []).map((point) => ({
    ...point,
    unlockCount: counts.get(point.id) ?? 0,
  }));
}

export async function getOwnerPoint(id: string): Promise<OwnerPickupPoint | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("pickup_points").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getOwnerPointAccesses(pointId: string): Promise<OwnerPointAccess[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("pickup_point_access")
    .select("user_id, granted_via, granted_at, profiles(full_name, email)")
    .eq("pickup_point_id", pointId)
    .order("granted_at", { ascending: false });

  return (data ?? []).flatMap((row) => {
    const profile = row.profiles as { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
    const person = Array.isArray(profile) ? profile[0] : profile;
    if (!person) {
      return [];
    }
    return [
      {
        userId: row.user_id,
        fullName: person.full_name,
        email: person.email,
        grantedVia: row.granted_via as OwnerPointAccess["grantedVia"],
        grantedAt: row.granted_at,
      },
    ];
  });
}

export async function getOwnerDiscountCodes(): Promise<OwnerDiscountCode[]> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOwnerDiscountCode(id: string): Promise<OwnerDiscountCode | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("discount_codes").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getOwnerDiscountCodeUses(codeId: string): Promise<OwnerDiscountCodeUse[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("discount_code_uses")
    .select("id, created_at, user_id, order_id, profiles(email), orders(order_number)")
    .eq("code_id", codeId)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    created_at: string;
    user_id: string;
    order_id: string;
    profiles: { email: string } | { email: string }[] | null;
    orders: { order_number: number } | { order_number: number }[] | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    return {
      id: row.id,
      created_at: row.created_at,
      user_email: profile?.email ?? row.user_id,
      order_number: order?.order_number ?? null,
      order_id: row.order_id,
    };
  });
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
  onSaleDay: boolean;
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

  const [productsResult, overridesResult, stockResult, availabilityResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, daily_cap_default, sort_order, weekdays, category_id, categories(name, sort_order)")
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
    supabase.rpc("product_availability", { p_day: from }),
  ]);

  type CategoryJoin = { name: string; sort_order: number | null };
  const products = ((productsResult.data ?? []) as {
    id: string;
    name: string;
    daily_cap_default: number;
    sort_order: number;
    weekdays: number[];
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
        weekdays: product.weekdays,
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
  const earliestByProduct = new Map(
    (availabilityResult.data ?? []).map((row) => [
      row.product_id,
      "earliest_date" in row && row.earliest_date
        ? String(row.earliest_date).slice(0, 10)
        : null,
    ]),
  );

  const cells: Record<string, LimitCell> = {};
  for (const product of products) {
    const earliest = earliestByProduct.get(product.id);
    for (const day of days) {
      const key = `${product.id}:${day}`;
      const override = overrides.get(key);
      const overrideCap = override?.cap ?? null;
      const onSaleDay =
        product.weekdays.includes(isoWeekday(day)) &&
        (!earliest || day >= earliest);
      cells[key] = {
        productId: product.id,
        day,
        defaultCap: product.dailyCapDefault,
        effectiveCap: overrideCap ?? product.dailyCapDefault,
        reserved: reserved.get(key) ?? 0,
        isAvailable: override?.is_available ?? true,
        hasOverride: Boolean(override),
        overrideCap,
        onSaleDay,
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
