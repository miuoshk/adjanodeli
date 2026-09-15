import { warsawDateIso } from "@/lib/dates";
import { createServerClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/lib/supabase/database.types";

const COUNTED_STATUSES = ["paid", "in_production", "delivered", "picked_up"] as const;

type OrderRow = Tables<"orders">;
type PickupPointRow = Tables<"pickup_points">;
type OrderItemQty = { qty: number };

type DayOrder = Pick<OrderRow, "id" | "status" | "total_grosze" | "pickup_point_id"> & {
  order_items: OrderItemQty[];
};

type RecentOrder = Pick<
  OrderRow,
  "id" | "order_number" | "status" | "total_grosze" | "pickup_date" | "created_at"
> & {
  pickup_points: Pick<PickupPointRow, "name"> | Pick<PickupPointRow, "name">[] | null;
};

export type DashboardPointRow = {
  pointId: string;
  name: string;
  orderCount: number;
  pickedUpCount: number;
};

export type DashboardRecentOrder = {
  id: string;
  orderNumber: number;
  status: string;
  totalGrosze: number;
  pickupDate: string;
  pointName: string;
};

export type DashboardData = {
  paidOrderCount: number;
  productionQty: number;
  revenueGrosze: number;
  pendingPaymentCount: number;
  paidReadyCount: number;
  points: DashboardPointRow[];
  recentOrders: DashboardRecentOrder[];
};

function isCounted(status: string): boolean {
  return (COUNTED_STATUSES as readonly string[]).includes(status);
}

function pointNameOf(
  value: RecentOrder["pickup_points"],
): string {
  if (!value) {
    return "punkt";
  }
  if (Array.isArray(value)) {
    return value[0]?.name ?? "punkt";
  }
  return value.name;
}

export async function getDashboardData(day: string): Promise<DashboardData> {
  const supabase = await createServerClient();

  const [dayResult, pointsResult, recentResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total_grosze, pickup_point_id, order_items(qty)")
      .eq("pickup_date", day),
    supabase
      .from("pickup_points")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("orders")
      .select("id, order_number, status, total_grosze, pickup_date, created_at, pickup_points(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const dayOrders = (dayResult.data ?? []) as DayOrder[];
  const points = pointsResult.data ?? [];
  const recent = (recentResult.data ?? []) as RecentOrder[];

  let paidOrderCount = 0;
  let productionQty = 0;
  let revenueGrosze = 0;
  let pendingPaymentCount = 0;
  let paidReadyCount = 0;

  const byPoint = new Map<string, DashboardPointRow>();
  for (const point of points) {
    byPoint.set(point.id, {
      pointId: point.id,
      name: point.name,
      orderCount: 0,
      pickedUpCount: 0,
    });
  }

  for (const order of dayOrders) {
    if (order.status === "pending_payment") {
      pendingPaymentCount += 1;
    }
    if (order.status === "paid") {
      paidReadyCount += 1;
    }
    if (!isCounted(order.status)) {
      continue;
    }
    paidOrderCount += 1;
    revenueGrosze += order.total_grosze;
    productionQty += order.order_items.reduce((sum, item) => sum + item.qty, 0);

    const row = byPoint.get(order.pickup_point_id);
    if (row) {
      row.orderCount += 1;
      if (order.status === "picked_up") {
        row.pickedUpCount += 1;
      }
    }
  }

  return {
    paidOrderCount,
    productionQty,
    revenueGrosze,
    pendingPaymentCount,
    paidReadyCount,
    points: [...byPoint.values()],
    recentOrders: recent.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      totalGrosze: order.total_grosze,
      pickupDate: order.pickup_date,
      pointName: pointNameOf(order.pickup_points),
    })),
  };
}

const PAGE_SIZE = 50;

export type AdminOrderListFilters = {
  day: string | "wszystkie";
  pointId: string | null;
  statuses: string[];
  q: string;
  page: number;
};

export type AdminOrderListRow = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string | null;
  pointName: string;
  pickupDate: string;
  itemsSummary: string;
  totalGrosze: number;
  status: string;
  pickupCode: string | null;
};

export type AdminOrderListResult = {
  rows: AdminOrderListRow[];
  total: number;
  page: number;
  pageSize: number;
};

type ListOrder = Pick<
  OrderRow,
  | "id"
  | "order_number"
  | "customer_name"
  | "customer_phone"
  | "pickup_date"
  | "total_grosze"
  | "status"
  | "pickup_code"
> & {
  order_items: { product_name: string; qty: number }[];
  pickup_points: Pick<PickupPointRow, "name"> | Pick<PickupPointRow, "name">[] | null;
};

function summarizeItems(items: { product_name: string; qty: number }[]): string {
  if (items.length === 0) {
    return "—";
  }
  return items.map((item) => `${item.qty}× ${item.product_name}`).join(", ");
}

function escapeIlike(value: string): string {
  return value.replace(/[%_,]/g, "").trim();
}

export async function getAdminOrderList(
  filters: AdminOrderListFilters,
): Promise<AdminOrderListResult> {
  const supabase = await createServerClient();
  const page = Math.max(1, filters.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, pickup_date, total_grosze, status, pickup_code, order_items(product_name, qty), pickup_points(name)",
      { count: "exact" },
    )
    .order("pickup_date", { ascending: true })
    .order("order_number", { ascending: true })
    .range(from, to);

  if (filters.day !== "wszystkie") {
    query = query.eq("pickup_date", filters.day);
  }
  if (filters.pointId) {
    query = query.eq("pickup_point_id", filters.pointId);
  }
  if (filters.statuses.length > 0) {
    query = query.in("status", filters.statuses);
  }

  const q = escapeIlike(filters.q);
  if (q) {
    const clauses = [
      `customer_name.ilike.%${q}%`,
      `customer_phone.ilike.%${q}%`,
      `pickup_code.ilike.%${q}%`,
    ];
    if (/^\d+$/.test(q)) {
      clauses.push(`order_number.eq.${q}`);
    }
    query = query.or(clauses.join(","));
  }

  const { data, count } = await query;
  const rows = (data ?? []) as ListOrder[];

  return {
    rows: rows.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      pointName: pointNameOf(order.pickup_points),
      pickupDate: order.pickup_date,
      itemsSummary: summarizeItems(order.order_items ?? []),
      totalGrosze: order.total_grosze,
      status: order.status,
      pickupCode: order.pickup_code,
    })),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export type AdminOrderEvent = {
  id: string;
  createdAt: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  actorName: string;
};

export type AdminOrderDetail = {
  order: OrderRow;
  items: Tables<"order_items">[];
  point: PickupPointRow | null;
  events: AdminOrderEvent[];
};

export async function getAdminOrderDetail(id: string): Promise<AdminOrderDetail | null> {
  const supabase = await createServerClient();

  const [orderResult, eventsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*), pickup_points(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("order_events")
      .select("id, created_at, from_status, to_status, note, actor")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const raw = orderResult.data as
    | (OrderRow & {
        order_items: Tables<"order_items">[];
        pickup_points: PickupPointRow | PickupPointRow[] | null;
      })
    | null;

  if (!raw) {
    return null;
  }

  const events = eventsResult.data ?? [];
  const actorIds = [
    ...new Set(events.map((event) => event.actor).filter((value): value is string => Boolean(value))),
  ];

  const profiles =
    actorIds.length > 0
      ? (
          await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
        ).data ?? []
      : [];

  const names = new Map(
    profiles.map((profile) => [
      profile.id,
      profile.full_name?.trim() || profile.email,
    ]),
  );

  const point = Array.isArray(raw.pickup_points)
    ? (raw.pickup_points[0] ?? null)
    : raw.pickup_points;

  return {
    order: raw,
    items: raw.order_items ?? [],
    point,
    events: events.map((event) => ({
      id: event.id,
      createdAt: event.created_at,
      fromStatus: event.from_status,
      toStatus: event.to_status,
      note: event.note,
      actorName: event.actor ? (names.get(event.actor) ?? "pracownik") : "system",
    })),
  };
}

export async function getAdminFilterOptions() {
  const supabase = await createServerClient();
  const [datesResult, pointsResult] = await Promise.all([
    supabase.rpc("available_pickup_dates"),
    supabase
      .from("pickup_points")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return {
    dates: (datesResult.data ?? []).map((value) => value.slice(0, 10)),
    points: pointsResult.data ?? [],
  };
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

export type ProductionRow = {
  productId: string;
  productName: string;
  categoryName: string;
  categorySort: number;
  productSort: number;
  totalQty: number;
  byPoint: Record<string, number>;
};

export type ProductionNote = {
  orderNumber: number;
  note: string;
};

export type ProductionData = {
  day: string;
  orderCount: number;
  pointNames: string[];
  rows: ProductionRow[];
  notes: ProductionNote[];
};

export async function getNearestOrderDay(): Promise<string> {
  const supabase = await createServerClient();
  const today = warsawDateIso(0);

  const { data: upcoming } = await supabase
    .from("orders")
    .select("pickup_date")
    .in("status", [...COUNTED_STATUSES])
    .gte("pickup_date", today)
    .order("pickup_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (upcoming?.pickup_date) {
    return upcoming.pickup_date.slice(0, 10);
  }

  const { data: latest } = await supabase
    .from("orders")
    .select("pickup_date")
    .in("status", [...COUNTED_STATUSES])
    .order("pickup_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return latest?.pickup_date?.slice(0, 10) ?? today;
}

export async function getProductionData(day: string): Promise<ProductionData> {
  const supabase = await createServerClient();

  const [summaryResult, productsResult, pointsResult, ordersResult] = await Promise.all([
    supabase.rpc("production_summary", { p_day: day }),
    supabase
      .from("products")
      .select("id, sort_order, category_id, categories(name, sort_order)"),
    supabase.from("pickup_points").select("id, name, sort_order").order("sort_order"),
    supabase
      .from("orders")
      .select("order_number, note, status")
      .eq("pickup_date", day)
      .in("status", [...COUNTED_STATUSES]),
  ]);

  type CategoryJoin = { name: string; sort_order: number | null };
  const products = (productsResult.data ?? []) as {
    id: string;
    sort_order: number;
    category_id: string | null;
    categories: CategoryJoin | CategoryJoin[] | null;
  }[];

  const meta = new Map(
    products.map((product) => {
      const category = Array.isArray(product.categories)
        ? (product.categories[0] ?? null)
        : product.categories;
      return [
        product.id,
        {
          categoryName: category?.name ?? "Inne",
          categorySort: category?.sort_order ?? 999,
          productSort: product.sort_order,
        },
      ] as const;
    }),
  );

  const rows: ProductionRow[] = (summaryResult.data ?? []).map((row) => {
    const info = meta.get(row.product_id);
    return {
      productId: row.product_id,
      productName: row.product_name,
      categoryName: info?.categoryName ?? "Inne",
      categorySort: info?.categorySort ?? 999,
      productSort: info?.productSort ?? 999,
      totalQty: row.total_qty,
      byPoint: asByPoint(row.by_point),
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

  const orderedPoints = (pointsResult.data ?? [])
    .map((point) => point.name)
    .filter((name) => rows.some((row) => (row.byPoint[name] ?? 0) > 0));
  const extras = [...new Set(rows.flatMap((row) => Object.keys(row.byPoint)))].filter(
    (name) => !orderedPoints.includes(name),
  );

  const notes = (ordersResult.data ?? [])
    .filter((order) => Boolean(order.note?.trim()))
    .map((order) => ({
      orderNumber: order.order_number,
      note: order.note?.trim() ?? "",
    }))
    .sort((a, b) => a.orderNumber - b.orderNumber);

  return {
    day,
    orderCount: ordersResult.data?.length ?? 0,
    pointNames: [...orderedPoints, ...extras],
    rows,
    notes,
  };
}

export type PackageItem = {
  id: string;
  pickupCode: string;
  customerName: string;
  itemsSummary: string;
  items: { name: string; qty: number }[];
  status: string;
  note: string | null;
};

export type PackageSection = {
  point: PickupPointRow;
  inProductionCount: number;
  packages: PackageItem[];
};

export type PackagesData = {
  day: string;
  sections: PackageSection[];
};

export async function getPackagesData(day: string): Promise<PackagesData> {
  const supabase = await createServerClient();

  const [pointsResult, ordersResult] = await Promise.all([
    supabase.from("pickup_points").select("*").order("sort_order"),
    supabase
      .from("orders")
      .select(
        "id, pickup_point_id, pickup_code, customer_name, status, note, order_items(product_name, qty)",
      )
      .eq("pickup_date", day)
      .in("status", [...COUNTED_STATUSES])
      .order("pickup_code", { ascending: true }),
  ]);

  type PackageOrder = {
    id: string;
    pickup_point_id: string;
    pickup_code: string | null;
    customer_name: string;
    status: string;
    note: string | null;
    order_items: { product_name: string; qty: number }[];
  };

  const orders = (ordersResult.data ?? []) as PackageOrder[];
  const points = pointsResult.data ?? [];

  const sections: PackageSection[] = points
    .map((point) => {
      const packages = orders
        .filter((order) => order.pickup_point_id === point.id)
        .map((order) => ({
          id: order.id,
          pickupCode: order.pickup_code ?? "—",
          customerName: order.customer_name,
          items: (order.order_items ?? []).map((item) => ({
            name: item.product_name,
            qty: item.qty,
          })),
          itemsSummary: summarizeItems(order.order_items ?? []),
          status: order.status,
          note: order.note,
        }));

      return {
        point,
        inProductionCount: packages.filter((item) => item.status === "in_production").length,
        packages,
      };
    })
    .filter((section) => section.packages.length > 0);

  return { day, sections };
}

export type HandoverOrder = {
  id: string;
  orderNumber: number;
  pickupCode: string | null;
  customerName: string;
  status: string;
  note: string | null;
  pickedUpAt: string | null;
  pickupPointId: string;
  pickupPointName: string;
  pickupDate: string;
  items: { name: string; qty: number }[];
};

export type HandoverReadyItem = {
  id: string;
  pickupCode: string;
  customerName: string;
};

export type HandoverPoint = {
  id: string;
  name: string;
};

type HandoverOrderRow = Pick<
  OrderRow,
  | "id"
  | "order_number"
  | "pickup_code"
  | "customer_name"
  | "status"
  | "note"
  | "picked_up_at"
  | "pickup_point_id"
  | "pickup_date"
> & {
  order_items: { product_name: string; qty: number }[];
  pickup_points: Pick<PickupPointRow, "name"> | Pick<PickupPointRow, "name">[] | null;
};

function mapHandoverOrder(order: HandoverOrderRow): HandoverOrder {
  return {
    id: order.id,
    orderNumber: order.order_number,
    pickupCode: order.pickup_code,
    customerName: order.customer_name,
    status: order.status,
    note: order.note,
    pickedUpAt: order.picked_up_at,
    pickupPointId: order.pickup_point_id,
    pickupPointName: pointNameOf(order.pickup_points),
    pickupDate: order.pickup_date,
    items: (order.order_items ?? []).map((item) => ({
      name: item.product_name,
      qty: item.qty,
    })),
  };
}

const HANDOVER_SELECT =
  "id, order_number, pickup_code, customer_name, status, note, picked_up_at, pickup_point_id, pickup_date, order_items(product_name, qty), pickup_points(name)";

export async function getHandoverPoints(): Promise<HandoverPoint[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("pickup_points")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function queryOrderByCode(day: string, code: string): Promise<HandoverOrder | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("orders")
    .select(HANDOVER_SELECT)
    .eq("pickup_date", day)
    .eq("pickup_code", code)
    .maybeSingle();

  return data ? mapHandoverOrder(data as HandoverOrderRow) : null;
}

export async function queryOrdersFallback(day: string, rawQuery: string): Promise<HandoverOrder[]> {
  const supabase = await createServerClient();
  const q = escapeIlike(rawQuery);
  if (!q) {
    return [];
  }

  let query = supabase.from("orders").select(HANDOVER_SELECT).limit(10);

  if (/^\d+$/.test(q)) {
    query = query.eq("order_number", Number(q));
  } else {
    query = query.eq("pickup_date", day).ilike("customer_name", `%${q}%`);
  }

  const { data } = await query;
  return ((data ?? []) as HandoverOrderRow[]).map(mapHandoverOrder);
}

export async function queryReadyToPickUp(
  day: string,
  pointId: string,
): Promise<HandoverReadyItem[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id, pickup_code, customer_name")
    .eq("pickup_date", day)
    .eq("pickup_point_id", pointId)
    .eq("status", "delivered")
    .order("pickup_code", { ascending: true });

  return (data ?? []).map((order) => ({
    id: order.id,
    pickupCode: order.pickup_code ?? "—",
    customerName: order.customer_name,
  }));
}
