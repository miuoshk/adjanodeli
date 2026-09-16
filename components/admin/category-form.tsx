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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyName } from "@/lib/admin/catalog";
import { createCategory, deleteCategory, updateCategory } from "@/lib/admin/owner-actions";
import type { OwnerCategoryRecord } from "@/lib/admin/owner-queries";
import { categoryPublicUrl } from "@/lib/categories/image";
import { deleteCategoryImage, uploadCategoryImage } from "@/lib/categories/upload";

const schema = z.object({
  name: z.string().min(1, "Podaj nazwę."),
  slug: z
    .string()
    .min(1, "Podaj slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Małe litery, cyfry i myślniki."),
  description: z.string(),
  sortOrder: z.coerce.number().int("Kolejność ma być liczbą."),
  leadDays: z.coerce.number().int().min(1, "Minimum 1 dzień."),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type CategoryFormProps = {
  category?: OwnerCategoryRecord;
  productCount?: number;
};

export function CategoryForm({ category, productCount = 0 }: CategoryFormProps) {
  const router = useRouter();
  const slugTouched = useRef(Boolean(category));
  const [imagePath, setImagePath] = useState(category?.image_path ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    category?.image_path ? categoryPublicUrl(category.image_path) : null,
  );
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      sortOrder: category?.sort_order ?? 0,
      leadDays: category?.lead_days ?? 1,
      isActive: category?.is_active ?? true,
    },
  });

  const leadDays = form.watch("leadDays");

  function onFileChange(file: File | null) {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPendingFile(file);
    setPreview(file ? URL.createObjectURL(file) : imagePath ? categoryPublicUrl(imagePath) : null);
  }

  async function persistImage(categoryId: string, previousPath: string | null) {
    if (pendingFile) {
      const uploaded = await uploadCategoryImage(categoryId, pendingFile);
      if (!uploaded.ok) {
        return { ok: false as const, message: uploaded.message, path: previousPath };
      }
      if (previousPath) {
        await deleteCategoryImage(previousPath);
      }
      return { ok: true as const, path: uploaded.path };
    }
    if (previousPath && !imagePath) {
      await deleteCategoryImage(previousPath);
      return { ok: true as const, path: null };
    }
    return { ok: true as const, path: imagePath };
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (!category) {
        const created = await createCategory({
          ...values,
          imagePath: null,
        });
        if (!created.ok) {
          toast(created.message);
          return;
        }
        const image = await persistImage(created.id, null);
        if (!image.ok) {
          toast(image.message);
          router.push(`/admin/kategorie/${created.id}`);
          return;
        }
        if (image.path) {
          const updated = await updateCategory(created.id, { ...values, imagePath: image.path });
          if (!updated.ok) {
            toast(updated.message);
          }
        }
        toast("Kategoria dodana.");
        router.push("/admin/kategorie");
        return;
      }

      const image = await persistImage(category.id, category.image_path);
      if (!image.ok) {
        toast(image.message);
        return;
      }
      const result = await updateCategory(category.id, { ...values, imagePath: image.path });
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
              <FormDescription>Dwa zdania, które widać na stronie kategorii.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
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
          <FormField
            control={form.control}
            name="leadDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Najwcześniejszy odbiór: za {leadDays} {leadDays === 1 ? "dzień" : "dni"}
                </FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={1} className="min-h-12 text-base" />
                </FormControl>
                <FormDescription>1 = na jutro, 2 = na pojutrze</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aktywna</FormLabel>
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

        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-h-12" disabled={saving}>
            {category ? "Zapisz" : "Dodaj kategorię"}
          </Button>
          {category ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-12"
              disabled={saving || productCount > 0}
              onClick={async () => {
                const result = await deleteCategory(category.id);
                if (!result.ok) {
                  toast(result.message);
                  return;
                }
                toast("Kategoria usunięta.");
                router.push("/admin/kategorie");
              }}
            >
              Usuń
            </Button>
          ) : null}
        </div>
        {category && productCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            Ta kategoria ma produkty. Możesz ją tylko wyłączyć.
          </p>
        ) : null}
      </form>
    </Form>
  );
}
