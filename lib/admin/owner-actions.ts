"use server";

import { revalidatePath } from "next/cache";

import { PRICE_RE, priceToGrosze } from "@/lib/admin/catalog";
import { requireRole } from "@/lib/auth";
import { isValidAccessCode, normalizeAccessCode } from "@/lib/pickup/access-code";
import { createServerClient } from "@/lib/supabase/server";
import { parseEmailDomains } from "@/lib/validation/email-domain";

const daySchema = /^\d{4}-\d{2}-\d{2}$/;
const uuidSchema = /^[0-9a-f-]{36}$/i;
const slugSchema = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const timeSchema = /^\d{2}:\d{2}(:\d{2})?$/;
const emailSchema = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function revalidateCatalog(categorySlug?: string) {
  revalidatePath("/");
  revalidatePath("/sklep");
  revalidatePath("/sklep", "layout");
  revalidatePath("/admin", "layout");
  if (categorySlug) {
    revalidatePath(`/sklep/${categorySlug}`);
  }
}

async function slugTaken(table: "products" | "pickup_points" | "categories", slug: string, exceptId?: string) {
  const supabase = await createServerClient();
  let query = supabase.from(table).select("id").eq("slug", slug);
  if (exceptId) {
    query = query.neq("id", exceptId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export type CategoryPayload = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  leadDays: number;
  isActive: boolean;
  imagePath: string | null;
};

function parseCategoryPayload(payload: CategoryPayload) {
  if (payload.name.trim().length === 0) {
    return { ok: false as const, message: "Podaj nazwę." };
  }
  if (!slugSchema.test(payload.slug)) {
    return { ok: false as const, message: "Slug: małe litery, cyfry i myślniki." };
  }
  if (!Number.isInteger(payload.sortOrder)) {
    return { ok: false as const, message: "Kolejność ma być liczbą całkowitą." };
  }
  if (!Number.isInteger(payload.leadDays) || payload.leadDays < 1) {
    return { ok: false as const, message: "Najwcześniejszy odbiór ma być liczbą ≥ 1." };
  }
  return { ok: true as const };
}

export async function createCategory(payload: CategoryPayload) {
  await requireRole("owner", "/admin/kategorie");
  const parsed = parseCategoryPayload(payload);
  if (!parsed.ok) {
    return parsed;
  }
  if (await slugTaken("categories", payload.slug)) {
    return { ok: false as const, message: "Taki slug już jest." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: payload.name.trim(),
      slug: payload.slug,
      description: payload.description.trim() || null,
      sort_order: payload.sortOrder,
      lead_days: payload.leadDays,
      is_active: payload.isActive,
      image_path: payload.imagePath,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false as const, message: "Nie udało się dodać kategorii." };
  }
  revalidateCatalog(payload.slug);
  return { ok: true as const, id: data.id };
}

export async function updateCategory(id: string, payload: CategoryPayload) {
  await requireRole("owner", "/admin/kategorie");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zła kategoria." };
  }
  const parsed = parseCategoryPayload(payload);
  if (!parsed.ok) {
    return parsed;
  }
  if (await slugTaken("categories", payload.slug, id)) {
    return { ok: false as const, message: "Taki slug już jest." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: payload.name.trim(),
      slug: payload.slug,
      description: payload.description.trim() || null,
      sort_order: payload.sortOrder,
      lead_days: payload.leadDays,
      is_active: payload.isActive,
      image_path: payload.imagePath,
    })
    .eq("id", id);

  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać kategorii." };
  }
  revalidateCatalog(payload.slug);
  return { ok: true as const };
}

export async function setCategoryActive(id: string, isActive: boolean) {
  await requireRole("owner", "/admin/kategorie");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zła kategoria." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("categories").update({ is_active: isActive }).eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  await requireRole("owner", "/admin/kategorie");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zła kategoria." };
  }

  const supabase = await createServerClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return { ok: false as const, message: "Ta kategoria ma produkty. Możesz ją tylko wyłączyć." };
  }

  const { data: category } = await supabase
    .from("categories")
    .select("image_path, slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się usunąć kategorii." };
  }

  if (category?.image_path) {
    await supabase.storage.from("categories").remove([category.image_path]);
  }
  revalidateCatalog(category?.slug);
  return { ok: true as const };
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
  isFeatured: boolean;
  weekdays: number[];
  imagePath: string | null;
  leadDays: number | null;
  promoPrice: string;
  promoFrom: string;
  promoTo: string;
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
  if (payload.leadDays !== null && (!Number.isInteger(payload.leadDays) || payload.leadDays < 1)) {
    return { ok: false as const, message: "Najwcześniejszy odbiór ma być pusty albo liczbą ≥ 1." };
  }
  const promo = parsePromoFields(payload.price, payload.promoPrice, payload.promoFrom, payload.promoTo);
  if (!promo.ok) {
    return promo;
  }
  return { ok: true as const };
}

function parsePromoFields(
  price: string,
  promoPrice: string,
  promoFrom: string,
  promoTo: string,
):
  | { ok: true; promoPriceGrosze: number | null; promoFrom: string | null; promoTo: string | null }
  | { ok: false; message: string } {
  const hasPrice = promoPrice.trim().length > 0;
  const hasFrom = promoFrom.trim().length > 0;
  const hasTo = promoTo.trim().length > 0;
  if (!hasPrice && !hasFrom && !hasTo) {
    return { ok: true, promoPriceGrosze: null, promoFrom: null, promoTo: null };
  }
  if (!hasPrice || !PRICE_RE.test(promoPrice)) {
    return { ok: false, message: "Cena promocyjna ma wyglądać jak 12,50." };
  }
  const promoGrosze = priceToGrosze(promoPrice);
  const regularGrosze = PRICE_RE.test(price) ? priceToGrosze(price) : 0;
  if (promoGrosze >= regularGrosze) {
    return { ok: false, message: "Cena promocyjna ma być niższa od zwykłej." };
  }
  if (!hasFrom || !hasTo || !daySchema.test(promoFrom) || !daySchema.test(promoTo)) {
    return { ok: false, message: "Podaj daty promocji od i do." };
  }
  if (promoFrom > promoTo) {
    return { ok: false, message: "Data „od” nie może być po „do”." };
  }
  return { ok: true, promoPriceGrosze: promoGrosze, promoFrom, promoTo };
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

  const promo = parsePromoFields(payload.price, payload.promoPrice, payload.promoFrom, payload.promoTo);
  if (!promo.ok) {
    return promo;
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
      is_featured: payload.isFeatured,
      weekdays: [...payload.weekdays].sort((a, b) => a - b),
      image_path: payload.imagePath,
      lead_days: payload.leadDays,
      promo_price_grosze: promo.promoPriceGrosze,
      promo_from: promo.promoFrom,
      promo_to: promo.promoTo,
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

  const promo = parsePromoFields(payload.price, payload.promoPrice, payload.promoFrom, payload.promoTo);
  if (!promo.ok) {
    return promo;
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
      is_featured: payload.isFeatured,
      weekdays: [...payload.weekdays].sort((a, b) => a - b),
      image_path: payload.imagePath,
      lead_days: payload.leadDays,
      promo_price_grosze: promo.promoPriceGrosze,
      promo_from: promo.promoFrom,
      promo_to: promo.promoTo,
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
  visibility: "public" | "restricted";
  accessCode: string;
  allowedEmailDomains: string[];
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
  if (payload.visibility !== "public" && payload.visibility !== "restricted") {
    return { ok: false as const, message: "Zła widoczność punktu." };
  }
  const accessCode = payload.accessCode.trim() ? normalizeAccessCode(payload.accessCode) : null;
  if (payload.visibility === "restricted" && (!accessCode || !isValidAccessCode(accessCode))) {
    return { ok: false as const, message: "Kod: 6–12 znaków, same wielkie litery i cyfry." };
  }
  if (accessCode && !isValidAccessCode(accessCode)) {
    return { ok: false as const, message: "Kod: 6–12 znaków, same wielkie litery i cyfry." };
  }
  const domains = parseEmailDomains(payload.allowedEmailDomains);
  if (!domains.ok) {
    return { ok: false as const, message: "Sprawdź format domen e-mail, np. mikolow.sr.gov.pl." };
  }
  return { ok: true as const, accessCode, domains: domains.domains };
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
      visibility: payload.visibility,
      access_code: parsed.accessCode,
      allowed_email_domains: parsed.domains,
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
      visibility: payload.visibility,
      access_code: parsed.accessCode,
      allowed_email_domains: parsed.domains,
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

export async function grantPickupPointAccess(pointId: string, email: string) {
  await requireRole("owner", "/admin/punkty-odbioru");
  if (!uuidSchema.test(pointId)) {
    return { ok: false as const, message: "Zły punkt." };
  }
  if (!emailSchema.test(email.trim())) {
    return { ok: false as const, message: "Podaj prawidłowy e-mail." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("grant_pickup_point_access", {
    p_email: email.trim(),
    p_pickup_point_id: pointId,
  });
  if (error) {
    if (error.message.includes("USER_NOT_FOUND")) {
      return { ok: false as const, message: "Nie ma takiego konta." };
    }
    return { ok: false as const, message: "Nie udało się nadać dostępu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function revokePickupPointAccess(pointId: string, userId: string) {
  await requireRole("owner", "/admin/punkty-odbioru");
  if (!uuidSchema.test(pointId) || !uuidSchema.test(userId)) {
    return { ok: false as const, message: "Zły wpis." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("revoke_pickup_point_access", {
    p_user_id: userId,
    p_pickup_point_id: pointId,
  });
  if (error) {
    return { ok: false as const, message: "Nie udało się cofnąć dostępu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function revokePickupPointCodeAccess(pointId: string) {
  await requireRole("owner", "/admin/punkty-odbioru");
  if (!uuidSchema.test(pointId)) {
    return { ok: false as const, message: "Zły punkt." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("revoke_pickup_point_code_access", {
    p_pickup_point_id: pointId,
  });
  if (error) {
    return { ok: false as const, message: "Nie udało się cofnąć dostępów." };
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
  revalidatePath("/sklep");
  return { ok: true as const };
}

const TAG_COLORS = ["gold", "khaki", "red"] as const;
type TagColor = (typeof TAG_COLORS)[number];

function isTagColor(value: string): value is TagColor {
  return TAG_COLORS.includes(value as TagColor);
}

function uniqueError(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export async function createAllergen(name: string, sortOrder: number) {
  await requireRole("owner", "/admin/slowniki");
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { ok: false as const, message: "Podaj nazwę." };
  }
  if (!Number.isInteger(sortOrder)) {
    return { ok: false as const, message: "Kolejność ma być liczbą całkowitą." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("allergens").insert({
    name: trimmed,
    sort_order: sortOrder,
    is_active: true,
  });
  if (uniqueError(error)) {
    return { ok: false as const, message: "Taka nazwa już jest." };
  }
  if (error) {
    return { ok: false as const, message: "Nie udało się dodać alergenu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function updateAllergen(
  id: string,
  payload: { name: string; sortOrder: number; isActive: boolean },
) {
  await requireRole("owner", "/admin/slowniki");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły alergen." };
  }
  const trimmed = payload.name.trim();
  if (trimmed.length === 0) {
    return { ok: false as const, message: "Podaj nazwę." };
  }
  if (!Number.isInteger(payload.sortOrder)) {
    return { ok: false as const, message: "Kolejność ma być liczbą całkowitą." };
  }

  const supabase = await createServerClient();
  const { data: current } = await supabase.from("allergens").select("name").eq("id", id).maybeSingle();
  if (!current) {
    return { ok: false as const, message: "Nie ma takiego alergenu." };
  }

  if (current.name !== trimmed) {
    const { error } = await supabase.rpc("rename_allergen", { p_old: current.name, p_new: trimmed });
    if (error) {
      if (uniqueError(error) || error.message.includes("unique")) {
        return { ok: false as const, message: "Taka nazwa już jest." };
      }
      return { ok: false as const, message: "Nie udało się zmienić nazwy." };
    }
  }

  const { error } = await supabase
    .from("allergens")
    .update({ sort_order: payload.sortOrder, is_active: payload.isActive })
    .eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać alergenu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function deleteAllergen(id: string) {
  await requireRole("owner", "/admin/slowniki");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły alergen." };
  }

  const supabase = await createServerClient();
  const { data: current } = await supabase.from("allergens").select("name").eq("id", id).maybeSingle();
  if (!current) {
    return { ok: false as const, message: "Nie ma takiego alergenu." };
  }

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .contains("allergens", [current.name]);

  if ((count ?? 0) > 0) {
    const { error } = await supabase.from("allergens").update({ is_active: false }).eq("id", id);
    if (error) {
      return { ok: false as const, message: "Nie udało się wyłączyć alergenu." };
    }
    revalidateCatalog();
    return { ok: true as const, deactivated: true as const };
  }

  const { error } = await supabase.from("allergens").delete().eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się usunąć alergenu." };
  }
  revalidateCatalog();
  return { ok: true as const, deactivated: false as const };
}

export async function createProductTag(payload: {
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
}) {
  await requireRole("owner", "/admin/slowniki");
  const name = payload.name.trim();
  if (name.length === 0) {
    return { ok: false as const, message: "Podaj nazwę." };
  }
  if (!slugSchema.test(payload.slug)) {
    return { ok: false as const, message: "Slug: małe litery, cyfry i myślniki." };
  }
  if (!isTagColor(payload.color)) {
    return { ok: false as const, message: "Kolor: gold, khaki albo red." };
  }
  if (!Number.isInteger(payload.sortOrder)) {
    return { ok: false as const, message: "Kolejność ma być liczbą całkowitą." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("product_tags").insert({
    name,
    slug: payload.slug,
    color: payload.color,
    sort_order: payload.sortOrder,
    is_active: true,
  });
  if (uniqueError(error)) {
    return { ok: false as const, message: "Taka nazwa albo slug już jest." };
  }
  if (error) {
    return { ok: false as const, message: "Nie udało się dodać tagu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function updateProductTag(
  id: string,
  payload: { name: string; slug: string; color: string; sortOrder: number; isActive: boolean },
) {
  await requireRole("owner", "/admin/slowniki");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły tag." };
  }
  const name = payload.name.trim();
  if (name.length === 0) {
    return { ok: false as const, message: "Podaj nazwę." };
  }
  if (!slugSchema.test(payload.slug)) {
    return { ok: false as const, message: "Slug: małe litery, cyfry i myślniki." };
  }
  if (!isTagColor(payload.color)) {
    return { ok: false as const, message: "Kolor: gold, khaki albo red." };
  }
  if (!Number.isInteger(payload.sortOrder)) {
    return { ok: false as const, message: "Kolejność ma być liczbą całkowitą." };
  }

  const supabase = await createServerClient();
  const { data: current } = await supabase.from("product_tags").select("name").eq("id", id).maybeSingle();
  if (!current) {
    return { ok: false as const, message: "Nie ma takiego tagu." };
  }

  if (current.name !== name) {
    const { error } = await supabase.rpc("rename_tag", { p_old: current.name, p_new: name });
    if (error) {
      if (uniqueError(error) || error.message.includes("unique")) {
        return { ok: false as const, message: "Taka nazwa już jest." };
      }
      return { ok: false as const, message: "Nie udało się zmienić nazwy." };
    }
  }

  const { error } = await supabase
    .from("product_tags")
    .update({
      slug: payload.slug,
      color: payload.color,
      sort_order: payload.sortOrder,
      is_active: payload.isActive,
    })
    .eq("id", id);
  if (uniqueError(error)) {
    return { ok: false as const, message: "Taki slug już jest." };
  }
  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać tagu." };
  }
  revalidateCatalog();
  return { ok: true as const };
}

export async function deleteProductTag(id: string) {
  await requireRole("owner", "/admin/slowniki");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły tag." };
  }

  const supabase = await createServerClient();
  const { data: current } = await supabase.from("product_tags").select("name").eq("id", id).maybeSingle();
  if (!current) {
    return { ok: false as const, message: "Nie ma takiego tagu." };
  }

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .contains("tags", [current.name]);

  if ((count ?? 0) > 0) {
    const { error } = await supabase.from("product_tags").update({ is_active: false }).eq("id", id);
    if (error) {
      return { ok: false as const, message: "Nie udało się wyłączyć tagu." };
    }
    revalidateCatalog();
    return { ok: true as const, deactivated: true as const };
  }

  const { error } = await supabase.from("product_tags").delete().eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się usunąć tagu." };
  }
  revalidateCatalog();
  return { ok: true as const, deactivated: false as const };
}

export type DiscountCodePayload = {
  code: string;
  type: "percent" | "amount";
  value: string;
  minOrder: string;
  maxDiscount: string;
  validFrom: string;
  validTo: string;
  maxUses: string;
  perUserOnce: boolean;
  pickupPointId: string;
  isActive: boolean;
};

function parseDiscountCodePayload(payload: DiscountCodePayload) {
  const code = payload.code.trim().replaceAll(" ", "").toUpperCase();
  if (code.length < 1 || /\s/.test(code)) {
    return { ok: false as const, message: "Podaj kod bez spacji." };
  }
  if (payload.type !== "percent" && payload.type !== "amount") {
    return { ok: false as const, message: "Wybierz typ kodu." };
  }

  let value = 0;
  if (payload.type === "percent") {
    value = Number.parseInt(payload.value, 10);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      return { ok: false as const, message: "Procent ma być od 1 do 100." };
    }
  } else {
    if (!PRICE_RE.test(payload.value)) {
      return { ok: false as const, message: "Kwota rabatu jak 10,00." };
    }
    value = priceToGrosze(payload.value);
    if (value < 1) {
      return { ok: false as const, message: "Kwota rabatu ma być większa od zera." };
    }
  }

  const minOrderRaw = payload.minOrder.trim() || "0,00";
  if (!PRICE_RE.test(minOrderRaw)) {
    return { ok: false as const, message: "Minimalna wartość jak 50,00." };
  }
  const minOrderGrosze = priceToGrosze(minOrderRaw);

  let maxDiscountGrosze: number | null = null;
  if (payload.maxDiscount.trim().length > 0) {
    if (!PRICE_RE.test(payload.maxDiscount)) {
      return { ok: false as const, message: "Limit rabatu jak 40,00." };
    }
    maxDiscountGrosze = priceToGrosze(payload.maxDiscount);
  }

  const validFrom = payload.validFrom.trim() ? payload.validFrom.trim() : null;
  const validTo = payload.validTo.trim() ? payload.validTo.trim() : null;
  if ((validFrom && !daySchema.test(validFrom)) || (validTo && !daySchema.test(validTo))) {
    return { ok: false as const, message: "Daty ważności mają być w formacie YYYY-MM-DD." };
  }
  if (validFrom && validTo && validFrom > validTo) {
    return { ok: false as const, message: "Data „od” nie może być po „do”." };
  }

  let maxUses: number | null = null;
  if (payload.maxUses.trim().length > 0) {
    maxUses = Number.parseInt(payload.maxUses, 10);
    if (!Number.isInteger(maxUses) || maxUses < 1) {
      return { ok: false as const, message: "Limit użyć ma być pusty albo liczbą ≥ 1." };
    }
  }

  const pickupPointId = payload.pickupPointId.trim();
  if (pickupPointId && !uuidSchema.test(pickupPointId)) {
    return { ok: false as const, message: "Zły punkt odbioru." };
  }

  return {
    ok: true as const,
    code,
    type: payload.type,
    value,
    minOrderGrosze,
    maxDiscountGrosze,
    validFrom,
    validTo,
    maxUses,
    perUserOnce: payload.perUserOnce,
    pickupPointId: pickupPointId || null,
    isActive: payload.isActive,
  };
}

export async function createDiscountCode(payload: DiscountCodePayload) {
  await requireRole("owner", "/admin/kody-rabatowe");
  const parsed = parseDiscountCodePayload(payload);
  if (!parsed.ok) {
    return parsed;
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("discount_codes").insert({
    code: parsed.code,
    type: parsed.type,
    value: parsed.value,
    min_order_grosze: parsed.minOrderGrosze,
    max_discount_grosze: parsed.maxDiscountGrosze,
    valid_from: parsed.validFrom,
    valid_to: parsed.validTo,
    max_uses: parsed.maxUses,
    per_user_once: parsed.perUserOnce,
    pickup_point_id: parsed.pickupPointId,
    is_active: parsed.isActive,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, message: "Taki kod już jest." };
    }
    return { ok: false as const, message: "Nie udało się dodać kodu." };
  }
  revalidatePath("/admin/kody-rabatowe");
  return { ok: true as const };
}

export async function updateDiscountCode(id: string, payload: DiscountCodePayload) {
  await requireRole("owner", "/admin/kody-rabatowe");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły kod." };
  }
  const parsed = parseDiscountCodePayload(payload);
  if (!parsed.ok) {
    return parsed;
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("discount_codes")
    .update({
      code: parsed.code,
      type: parsed.type,
      value: parsed.value,
      min_order_grosze: parsed.minOrderGrosze,
      max_discount_grosze: parsed.maxDiscountGrosze,
      valid_from: parsed.validFrom,
      valid_to: parsed.validTo,
      max_uses: parsed.maxUses,
      per_user_once: parsed.perUserOnce,
      pickup_point_id: parsed.pickupPointId,
      is_active: parsed.isActive,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, message: "Taki kod już jest." };
    }
    return { ok: false as const, message: "Nie udało się zapisać kodu." };
  }
  revalidatePath("/admin/kody-rabatowe");
  revalidatePath(`/admin/kody-rabatowe/${id}`);
  return { ok: true as const };
}

export async function setDiscountCodeActive(id: string, isActive: boolean) {
  await requireRole("owner", "/admin/kody-rabatowe");
  if (!uuidSchema.test(id)) {
    return { ok: false as const, message: "Zły kod." };
  }
  const supabase = await createServerClient();
  const { error } = await supabase.from("discount_codes").update({ is_active: isActive }).eq("id", id);
  if (error) {
    return { ok: false as const, message: "Nie udało się zapisać." };
  }
  revalidatePath("/admin/kody-rabatowe");
  return { ok: true as const };
}
