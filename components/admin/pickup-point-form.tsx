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
import { WEEKDAYS, slugifyName, timeInputValue } from "@/lib/admin/catalog";
import { createPickupPoint, deletePickupPoint, updatePickupPoint } from "@/lib/admin/owner-actions";
import type { OwnerPickupPoint } from "@/lib/admin/owner-queries";

const schema = z.object({
  name: z.string().min(1, "Podaj nazwę."),
  slug: z
    .string()
    .min(1, "Podaj slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Małe litery, cyfry i myślniki."),
  address: z.string().min(1, "Podaj adres."),
  description: z.string(),
  pickupFrom: z.string().min(1, "Podaj godzinę od."),
  pickupTo: z.string().min(1, "Podaj godzinę do."),
  weekdays: z.array(z.number()).min(1, "Zaznacz przynajmniej jeden dzień."),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int("Kolejność ma być liczbą."),
});

type FormValues = z.infer<typeof schema>;

export function PickupPointForm({ point }: { point?: OwnerPickupPoint }) {
  const router = useRouter();
  const slugTouched = useRef(Boolean(point));
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: point?.name ?? "",
      slug: point?.slug ?? "",
      address: point?.address ?? "",
      description: point?.description ?? "",
      pickupFrom: point ? timeInputValue(point.pickup_from) : "08:00",
      pickupTo: point ? timeInputValue(point.pickup_to) : "09:00",
      weekdays: point?.weekdays ?? [1, 2, 3, 4, 5],
      isActive: point?.is_active ?? true,
      sortOrder: point?.sort_order ?? 0,
    },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const payload = {
        ...values,
        weekdays: [...values.weekdays].sort((a, b) => a - b),
      };
      if (!point) {
        const result = await createPickupPoint(payload);
        if (!result.ok) {
          toast(result.message);
          return;
        }
        toast("Punkt dodany.");
        router.push("/admin/punkty-odbioru");
        return;
      }
      const result = await updatePickupPoint(point.id, payload);
      if (!result.ok) {
        toast(result.message);
        return;
      }
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres</FormLabel>
              <FormControl>
                <Input {...field} className="min-h-12 text-base" />
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
                <Input {...field} className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pickupFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Od</FormLabel>
                <FormControl>
                  <Input {...field} type="time" className="min-h-12 text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pickupTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Do</FormLabel>
                <FormControl>
                  <Input {...field} type="time" className="min-h-12 text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="weekdays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dni tygodnia</FormLabel>
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

        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-h-12" disabled={saving}>
            {point ? "Zapisz" : "Dodaj punkt"}
          </Button>
          {point ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-12"
              disabled={saving}
              onClick={async () => {
                const result = await deletePickupPoint(point.id);
                if (!result.ok) {
                  toast(result.message);
                  return;
                }
                toast("Punkt usunięty.");
                router.push("/admin/punkty-odbioru");
              }}
            >
              Usuń
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
