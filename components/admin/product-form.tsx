"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ActiveSwitch } from "@/components/admin/active-switch";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRICE_RE, WEEKDAYS, groszeToPriceInput, priceToGrosze, slugifyName } from "@/lib/admin/catalog";
import { createProduct, updateProduct } from "@/lib/admin/owner-actions";
import type { OwnerCategory, OwnerDictionaryOption, OwnerProduct } from "@/lib/admin/owner-queries";
import { productPublicUrl } from "@/lib/products/image";
import { deleteProductImage, uploadProductImage } from "@/lib/products/upload";

const schema = z.object({
  name: z.string().min(1, "Podaj nazwę."),
  slug: z
    .string()
    .min(1, "Podaj slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Małe litery, cyfry i myślniki."),
  categoryId: z.string().uuid("Wybierz kategorię."),
  description: z.string(),
  price: z.string().regex(PRICE_RE, "Cena jak 12,50."),
  allergens: z.array(z.string()),
  tags: z.array(z.string()),
  dailyCapDefault: z.coerce.number().int().min(0, "Limit ≥ 0."),
  sortOrder: z.coerce.number().int("Kolejność ma być liczbą."),
  isActive: z.boolean(),
  isNew: z.boolean(),
  isFeatured: z.boolean(),
  weekdays: z.array(z.number()).min(1, "Zaznacz przynajmniej jeden dzień."),
  leadDays: z.enum(["", "1", "2", "3", "5", "7"]),
  promoPrice: z.string(),
  promoFrom: z.string(),
  promoTo: z.string(),
}).superRefine((values, ctx) => {
  const hasPromo =
    values.promoPrice.trim().length > 0 ||
    values.promoFrom.trim().length > 0 ||
    values.promoTo.trim().length > 0;
  if (!hasPromo) {
    return;
  }
  if (!PRICE_RE.test(values.promoPrice)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoPrice"], message: "Cena jak 12,50." });
    return;
  }
  if (PRICE_RE.test(values.price) && priceToGrosze(values.promoPrice) >= priceToGrosze(values.price)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["promoPrice"],
      message: "Ma być niższa od zwykłej ceny.",
    });
  }
  if (!values.promoFrom || !values.promoTo) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoFrom"], message: "Podaj od i do." });
    return;
  }
  if (values.promoFrom > values.promoTo) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoFrom"], message: "Od nie może być po do." });
  }
});

type FormValues = z.infer<typeof schema>;

type ProductFormProps = {
  categories: OwnerCategory[];
  allergens: OwnerDictionaryOption[];
  tags: OwnerDictionaryOption[];
  product?: OwnerProduct;
};

function visibleOptions(items: OwnerDictionaryOption[], selected: string[]) {
  return items.filter((item) => item.is_active || selected.includes(item.name));
}

function productLeadChoice(product?: OwnerProduct): FormValues["leadDays"] {
  const value =
    product && "lead_days" in product
      ? (product as OwnerProduct & { lead_days?: number | null }).lead_days
      : null;
  if (value === 1 || value === 2 || value === 3 || value === 5 || value === 7) {
    return String(value) as FormValues["leadDays"];
  }
  return "";
}

export function ProductForm({ categories, allergens, tags, product }: ProductFormProps) {
  const router = useRouter();
  const slugTouched = useRef(Boolean(product));
  const [imagePath, setImagePath] = useState(product?.image_path ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    product?.image_path ? productPublicUrl(product.image_path) : null,
  );
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      categoryId: product?.category_id ?? "",
      description: product?.description ?? "",
      price: product ? groszeToPriceInput(product.price_grosze) : "",
      allergens: product?.allergens ?? [],
      tags: product?.tags ?? [],
      dailyCapDefault: product?.daily_cap_default ?? 20,
      sortOrder: product?.sort_order ?? 0,
      isActive: product?.is_active ?? true,
      isNew: product?.is_new ?? false,
      isFeatured: product?.is_featured ?? false,
      weekdays: product?.weekdays ?? [1, 2, 3, 4, 5, 6, 7],
      leadDays: productLeadChoice(product),
      promoPrice: product?.promo_price_grosze != null ? groszeToPriceInput(product.promo_price_grosze) : "",
      promoFrom: product?.promo_from ? product.promo_from.slice(0, 10) : "",
      promoTo: product?.promo_to ? product.promo_to.slice(0, 10) : "",
    },
  });

  function onFileChange(file: File | null) {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPendingFile(file);
    setPreview(file ? URL.createObjectURL(file) : imagePath ? productPublicUrl(imagePath) : null);
  }

  async function persistImage(productId: string, previousPath: string | null) {
    if (pendingFile) {
      const uploaded = await uploadProductImage(productId, pendingFile);
      if (!uploaded.ok) {
        return { ok: false as const, message: uploaded.message, path: previousPath };
      }
      if (previousPath) {
        await deleteProductImage(previousPath);
      }
      return { ok: true as const, path: uploaded.path };
    }
    if (previousPath && !imagePath) {
      await deleteProductImage(previousPath);
      return { ok: true as const, path: null };
    }
    return { ok: true as const, path: imagePath };
  }

  function toPayload(values: FormValues, imagePathValue: string | null) {
    return {
      ...values,
      leadDays: values.leadDays === "" ? null : Number(values.leadDays),
      imagePath: imagePathValue,
    };
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (!product) {
        const created = await createProduct(toPayload(values, null));
        if (!created.ok) {
          toast(created.message);
          return;
        }
        const image = await persistImage(created.id, null);
        if (!image.ok) {
          toast(image.message);
          router.push(`/admin/produkty/${created.id}`);
          return;
        }
        if (image.path) {
          const updated = await updateProduct(created.id, toPayload(values, image.path));
          if (!updated.ok) {
            toast(updated.message);
          }
        }
        toast("Produkt dodany.");
        router.push("/admin/produkty");
        return;
      }

      const image = await persistImage(product.id, product.image_path);
      if (!image.ok) {
        toast(image.message);
        return;
      }
      const result = await updateProduct(product.id, toPayload(values, image.path));
      if (!result.ok) {
        toast(result.message);
        return;
      }
      setImagePath(image.path);
      setPendingFile(null);
      toast("Zapisane.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazwa</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-12 text-base"
                  onChange={(event) => {
                    field.onChange(event);
                    if (!slugTouched.current) {
                      form.setValue("slug", slugifyName(event.target.value));
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="min-h-12 font-mono text-base"
                  onChange={(event) => {
                    slugTouched.current = true;
                    field.onChange(event.target.value.toLowerCase());
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategoria</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base"
                >
                  <option value="">Wybierz</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opis</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cena (zł)</FormLabel>
              <FormControl>
                <Input {...field} inputMode="decimal" placeholder="12,50" className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <fieldset className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
          <legend className="px-1 text-sm font-medium">Promocja</legend>
          <FormField
            control={form.control}
            name="promoPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cena promocyjna (zł)</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="decimal" placeholder="9,90" className="min-h-12 text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="promoFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Od</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="min-h-12 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="promoTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="min-h-12 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <FormField
          control={form.control}
          name="allergens"
          render={({ field }) => {
            const options = visibleOptions(allergens, field.value);
            return (
            <FormItem>
              <FormLabel>Alergeny</FormLabel>
              {options.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Brak alergenów w słowniku. Dodaj je w Słownikach.
                </p>
              ) : (
              <div className="flex flex-wrap gap-2">
                {options.map((item) => (
                  <label
                    key={item.name}
                    className="flex min-h-12 items-center gap-2 rounded-md border border-[var(--adj-cream-dark)] bg-card px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={field.value.includes(item.name)}
                      onChange={(event) => {
                        field.onChange(
                          event.target.checked
                            ? [...field.value, item.name]
                            : field.value.filter((value) => value !== item.name),
                        );
                      }}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
              )}
              <FormMessage />
            </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => {
            const options = visibleOptions(tags, field.value);
            return (
            <FormItem>
              <FormLabel>Tagi</FormLabel>
              {options.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Brak tagów w słowniku. Dodaj je w Słownikach.
                </p>
              ) : (
              <div className="flex flex-wrap gap-2">
                {options.map((item) => (
                  <label
                    key={item.name}
                    className="flex min-h-12 items-center gap-2 rounded-md border border-[var(--adj-cream-dark)] bg-card px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={field.value.includes(item.name)}
                      onChange={(event) => {
                        field.onChange(
                          event.target.checked
                            ? [...field.value, item.name]
                            : field.value.filter((value) => value !== item.name),
                        );
                      }}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
              )}
              <FormMessage />
            </FormItem>
            );
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dailyCapDefault"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limit domyślny</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={0} className="min-h-12 text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kolejność</FormLabel>
                <FormControl>
                  <Input {...field} type="number" className="min-h-12 text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="leadDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Najwcześniejszy odbiór</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base"
                >
                  <option value="">jak kategoria</option>
                  <option value="1">za 1 dzień</option>
                  <option value="2">za 2 dni</option>
                  <option value="3">za 3 dni</option>
                  <option value="5">za 5 dni</option>
                  <option value="7">za 7 dni</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weekdays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dni sprzedaży</FormLabel>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day.value}
                    className="flex min-h-12 items-center gap-2 rounded-md border border-[var(--adj-cream-dark)] bg-card px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={field.value.includes(day.value)}
                      onChange={(event) => {
                        field.onChange(
                          event.target.checked
                            ? [...field.value, day.value]
                            : field.value.filter((value) => value !== day.value),
                        );
                      }}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isNew"
          render={({ field }) => (
            <FormItem>
              <label className="flex min-h-12 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="size-4"
                />
                Nowość
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isFeatured"
          render={({ field }) => (
            <FormItem>
              <label className="flex min-h-12 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="size-4"
                />
                Polecany na stronie głównej
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aktywny</FormLabel>
              <FormControl>
                <ActiveSwitch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Zdjęcie</Label>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-32 w-32 rounded-md object-cover" />
          ) : (
            <p className="text-sm text-muted-foreground">Brak zdjęcia.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="min-h-12 max-w-xs text-base"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            {preview ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-12"
                onClick={() => {
                  onFileChange(null);
                  setImagePath(null);
                }}
              >
                Usuń zdjęcie
              </Button>
            ) : null}
          </div>
        </div>

        <Button type="submit" className="min-h-12" disabled={saving}>
          {product ? "Zapisz" : "Dodaj produkt"}
        </Button>
      </form>
    </Form>
  );
}
