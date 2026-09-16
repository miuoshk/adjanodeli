"use server";

import { revalidatePath } from "next/cache";

import { PRICE_RE, priceToGrosze } from "@/lib/admin/catalog";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

const daySchema = /^\d{4}-\d{2}-\d{2}$/;
const uuidSchema = /^[0-9a-f-]{36}$/i;
const slugSchema = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const timeSchema = /^\d{2}:\d{2}(:\d{2})?$/;
const emailSchema = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

async function slugTaken(table: "products" | "pickup_points", slug: string, exceptId?: string) {
  const supabase = await createServerClient();
  let query = supabase.from(table).select("id").eq("slug", slug);
  if (exceptId) {
    query = query.neq("id", exceptId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function setProductActive(id: string, isActive: boolean) {
  await requireRole("owner", "/admin/produkty");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły produkt." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export type ProductPayload = {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: string;
  allergens: string[];
  tags: string[];
  dailyCapDefault: number;
  sortOrder: number;
  isActive: boolean;
  isNew: boolean;
  weekdays: number[];
  imagePath: string | null;
};

function parseProductPayload(payload: ProductPayload) {
  if (payload.name.trim().length === 0) {
    return { ok: false as const, message: "Podaj nazwę." };
  }
  if (!slugSchema.test(payload.slug)) {
    return { ok: false as const, message: "Slug: małe litery, cyfry i myślniki." };
  }
  if (!uuidSchema.test(payload.categoryId)) {
    return { ok: false as const, message: "Wybierz kategorię." };
  }
  if (!PRICE_RE.test(payload.price)) {
    return { ok: false as const, message: "Cena ma wyglądać jak 12,50." };
  }
  if (!Number.isInteger(payload.dailyCapDefault) || payload.dailyCapDefault < 0) {
    return { ok: false as const, message: "Limit ma być liczbą całkowitą." };
  }
  if (!Number.isInteger(payload.sortOrder)) {
    return { ok: false as const, message: "Kolejność ma być liczbą całkowitą." };
  }
  if (payload.weekdays.length === 0 || payload.weekdays.some((day) => day < 1 || day > 7)) {
    return { ok: false as const, message: "Zaznacz przynajmniej jeden dzień." };
  }
  return { ok: true as const };
}

export async function createProduct(payload: ProductPayload) {
  await requireRole("owner", "/admin/produkty");
  const parsed = parseProductPayload(payload);
  if (!parsed.ok) {
    return parsed;
  }
  if (await slugTaken("products", payload.slug)) {
    return { ok: false as const, message: "Taki slug już jest." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: payload.name.trim(),
      slug: payload.slug,
      category_id: payload.categoryId,
      description: payload.description.trim() || null,
      price_grosze: priceToGrosze(payload.price),
      allergens: payload.allergens,
      tags: payload.tags,
      daily_cap_default: payload.dailyCapDefault,
      sort_order: payload.sortOrder,
      is_active: payload.isActive,
      is_new: payload.isNew,
      weekdays: [...payload.weekdays].sort((a, b) => a - b),
      image_path: payload.imagePath,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false as const, message: "Nie udało się dodać produktu." };
  }
  revalidateCatalog();
  return { ok: true as const, id: data.id };
}

export async function updateProduct(id: string, payload: ProductPayload) {
  await requireRole("owner", "/admin/produkty");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły produkt." };
  }
  const parsed = parseProductPayload(payload);
  if (!parsed.ok) {
    return parsed;
  }
  if (await slugTaken("products", payload.slug, id)) {
    return { ok: false as const, message: "Taki slug już jest." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: payload.name.trim(),
      slug: payload.slug,
      category_id: payload.categoryId,
      description: payload.description.trim() || null,
      price_grosze: priceToGrosze(payload.price),
      allergens: payload.allergens,
      tags: payload.tags,
      daily_cap_default: payload.dailyCapDefault,
      sort_order: payload.sortOrder,
      is_active: payload.isActive,
      is_new: payload.isNew,
      weekdays: [...payload.weekdays].sort((a, b) => a - b),
      image_path: payload.imagePath,
    })
    .eq("id", id);

  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać produktu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function upsertDayOverride(input: {
  productId: string;
  day: string;
  cap: number | null;
  isAvailable: boolean;
}) {
  await requireRole("owner", "/admin/limity");
  if (!uuidSchema.test(input.productId) || !daySchema.test(input.day)) {
    return { ok: false as const, message: "Złe dane." };
  }
  if (input.cap !== null && (!Number.isInteger(input.cap) || input.cap < 0)) {
    return { ok: false as const, message: "Limit ma być pusty albo liczbą całkowitą." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("product_day_overrides").upsert(
    {
      product_id: input.productId,
      day: input.day,
      cap: input.cap,
      is_available: input.isAvailable,
    },
    { onConflict: "product_id,day" },
  );

  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać limitu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function deleteDayOverride(productId: string, day: string) {
  await requireRole("owner", "/admin/limity");
  if (!uuidSchema.test(productId) || !daySchema.test(day)) {
    return { ok: false as const, message: "Złe dane." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("product_day_overrides")
    .delete()
    .eq("product_id", productId)
    .eq("day", day);

  if (error) {
    return { ok: false as const, message: "Nie udało się przywrócić domyślnego." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export type PickupPointPayload = {
  name: string;
  slug: string;
  address: string;
  description: string;
  pickupFrom: string;
  pickupTo: string;
  weekdays: number[];
  isActive: boolean;
  sortOrder: number;
};

function parsePointPayload(payload: PickupPointPayload) {
  if (payload.name.trim().length === 0) {
    return { ok: false as const, message: "Podaj nazwę." };
  }
  if (!slugSchema.test(payload.slug)) {
    return { ok: false as const, message: "Slug: małe litery, cyfry i myślniki." };
  }
  if (payload.address.trim().length === 0) {
    return { ok: false as const, message: "Podaj adres." };
  }
  if (!timeSchema.test(payload.pickupFrom) || !timeSchema.test(payload.pickupTo)) {
    return { ok: false as const, message: "Okno odbioru ma być godziną." };
  }
  if (payload.weekdays.length === 0 || payload.weekdays.some((day) => day < 1 || day > 7)) {
    return { ok: false as const, message: "Zaznacz przynajmniej jeden dzień." };
  }
  if (!Number.isInteger(payload.sortOrder)) {
    return { ok: false as const, message: "Kolejność ma być liczbą całkowitą." };
  }
  return { ok: true as const };
}

export async function createPickupPoint(payload: PickupPointPayload) {
  await requireRole("owner", "/admin/punkty-odbioru");
  const parsed = parsePointPayload(payload);
  if (!parsed.ok) {
    return parsed;
  }
  if (await slugTaken("pickup_points", payload.slug)) {
    return { ok: false as const, message: "Taki slug już jest." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pickup_points")
    .insert({
      name: payload.name.trim(),
      slug: payload.slug,
      address: payload.address.trim(),
      description: payload.description.trim() || null,
      pickup_from: payload.pickupFrom,
      pickup_to: payload.pickupTo,
      weekdays: payload.weekdays,
      is_active: payload.isActive,
      sort_order: payload.sortOrder,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false as const, message: "Nie udało się dodać punktu." };
  }
  revalidateCatalog();
  return { ok: true as const, id: data.id };
}

export async function updatePickupPoint(id: string, payload: PickupPointPayload) {
  await requireRole("owner", "/admin/punkty-odbioru");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły punkt." };
  }
  const parsed = parsePointPayload(payload);
  if (!parsed.ok) {
    return parsed;
  }
  if (await slugTaken("pickup_points", payload.slug, id)) {
    return { ok: false as const, message: "Taki slug już jest." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("pickup_points")
    .update({
      name: payload.name.trim(),
      slug: payload.slug,
      address: payload.address.trim(),
      description: payload.description.trim() || null,
      pickup_from: payload.pickupFrom,
      pickup_to: payload.pickupTo,
      weekdays: payload.weekdays,
      is_active: payload.isActive,
      sort_order: payload.sortOrder,
    })
    .eq("id", id);

  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać punktu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function deletePickupPoint(id: string) {
  await requireRole("owner", "/admin/punkty-odbioru");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły punkt." };
  }

  const supabase = await createServerClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("pickup_point_id", id);

  if ((count ?? 0) > 0) {
    return { ok: false as const, message: "Ten punkt ma zamówienia. Możesz go tylko wyłączyć." };
  }

  const { error } = await supabase.from("pickup_points").delete().eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się usunąć punktu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export type SettingsPayload = {
  bakeryName: string;
  cutoffTime: string;
  orderWeekdays: number[];
  maxDaysAhead: number;
  closedDates: string[];
  pendingOrderTtlMinutes: number;
  maxQtyPerItem: number;
  ownerEmail: string;
  ownerPhone: string;
  customerCancellationEnabled: boolean;
};

export async function saveSettings(payload: SettingsPayload) {
  await requireRole("owner", "/admin/ustawienia");

  if (payload.bakeryName.trim().length === 0) {
    return { ok: false as const, message: "Podaj nazwę." };
  }
  if (!timeSchema.test(payload.cutoffTime)) {
    return { ok: false as const, message: "Cutoff ma być godziną." };
  }
  if (payload.orderWeekdays.length === 0 || payload.orderWeekdays.some((day) => day < 1 || day > 7)) {
    return { ok: false as const, message: "Zaznacz dni zamówień." };
  }
  if (!Number.isInteger(payload.maxDaysAhead) || payload.maxDaysAhead < 1) {
    return { ok: false as const, message: "Max dni do przodu ma być liczbą ≥ 1." };
  }
  if (payload.closedDates.some((day) => !daySchema.test(day))) {
    return { ok: false as const, message: "Zła data zamknięcia." };
  }
  if (!Number.isInteger(payload.pendingOrderTtlMinutes) || payload.pendingOrderTtlMinutes < 30) {
    return { ok: false as const, message: "Czas na płatność musi być ≥ 30 minut (Stripe)." };
  }
  if (!Number.isInteger(payload.maxQtyPerItem) || payload.maxQtyPerItem < 1) {
    return { ok: false as const, message: "Max sztuk ma być liczbą ≥ 1." };
  }
  if (!emailSchema.test(payload.ownerEmail.trim())) {
    return { ok: false as const, message: "Podaj e-mail." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("settings")
    .update({
      bakery_name: payload.bakeryName.trim(),
      cutoff_time: payload.cutoffTime,
      order_weekdays: payload.orderWeekdays,
      max_days_ahead: payload.maxDaysAhead,
      closed_dates: [...new Set(payload.closedDates)].sort(),
      pending_order_ttl_minutes: payload.pendingOrderTtlMinutes,
      max_qty_per_item: payload.maxQtyPerItem,
      owner_email: payload.ownerEmail.trim(),
      owner_phone: payload.ownerPhone.trim() || null,
      customer_cancellation_enabled: payload.customerCancellationEnabled,
    })
    .eq("id", 1);

  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać ustawień." };
  }

  revalidatePath("/");
  return { ok: true as const };
}
