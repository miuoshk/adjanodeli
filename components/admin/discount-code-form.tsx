"use client";

import { useState } from "react";
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
import { groszeToPriceInput } from "@/lib/admin/catalog";
import { createDiscountCode, updateDiscountCode } from "@/lib/admin/owner-actions";
import type { OwnerDiscountCode, OwnerPickupPoint } from "@/lib/admin/owner-queries";
import { generateDiscountCode } from "@/lib/orders/discount-code";

const schema = z.object({
  code: z.string().min(1, "Podaj kod."),
  type: z.enum(["percent", "amount"]),
  value: z.string().min(1, "Podaj wartość."),
  minOrder: z.string(),
  maxDiscount: z.string(),
  validFrom: z.string(),
  validTo: z.string(),
  maxUses: z.string(),
  perUserOnce: z.boolean(),
  pickupPointId: z.string(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type DiscountCodeFormProps = {
  code?: OwnerDiscountCode;
  points: OwnerPickupPoint[];
};

export function DiscountCodeForm({ code, points }: DiscountCodeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: code?.code ?? "",
      type: code?.type === "amount" ? "amount" : "percent",
      value:
        code?.type === "amount" && code.value != null
          ? groszeToPriceInput(code.value)
          : code?.value != null
            ? String(code.value)
            : "",
      minOrder: code ? groszeToPriceInput(code.min_order_grosze) : "0,00",
      maxDiscount: code?.max_discount_grosze != null ? groszeToPriceInput(code.max_discount_grosze) : "",
      validFrom: code?.valid_from ? code.valid_from.slice(0, 10) : "",
      validTo: code?.valid_to ? code.valid_to.slice(0, 10) : "",
      maxUses: code?.max_uses != null ? String(code.max_uses) : "",
      perUserOnce: code?.per_user_once ?? true,
      pickupPointId: code?.pickup_point_id ?? "",
      isActive: code?.is_active ?? true,
    },
  });

  const type = form.watch("type");

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const payload = {
        ...values,
        code: values.code.trim().replaceAll(" ", "").toUpperCase(),
      };
      if (!code) {
        const result = await createDiscountCode(payload);
        if (!result.ok) {
          toast(result.message);
          return;
        }
        toast("Kod dodany.");
        router.push("/admin/kody-rabatowe");
        return;
      }
      const result = await updateDiscountCode(code.id, payload);
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

  function fillGenerated() {
    const next = generateDiscountCode();
    form.setValue("code", next);
  }

  async function copyCode() {
    const value = form.getValues("code");
    if (!value) {
      return;
    }
    await navigator.clipboard.writeText(value);
    toast("Skopiowane.");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-5">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kod</FormLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <FormControl>
                  <Input
                    {...field}
                    className="min-h-12 text-base uppercase"
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  />
                </FormControl>
                <Button type="button" variant="outline" className="min-h-12" onClick={fillGenerated}>
                  Wygeneruj kod
                </Button>
                <Button type="button" variant="outline" className="min-h-12" onClick={() => void copyCode()}>
                  Kopiuj
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Typ</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base"
                >
                  <option value="percent">procent</option>
                  <option value="amount">kwota</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === "percent" ? "Procent" : "Kwota (zł)"}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  inputMode={type === "percent" ? "numeric" : "decimal"}
                  placeholder={type === "percent" ? "10" : "10,00"}
                  className="min-h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimalne zamówienie (zł)</FormLabel>
              <FormControl>
                <Input {...field} inputMode="decimal" placeholder="0,00" className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxDiscount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maks. rabat (zł, puste = bez limitu)</FormLabel>
              <FormControl>
                <Input {...field} inputMode="decimal" placeholder="40,00" className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="validFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ważny od</FormLabel>
                <FormControl>
                  <Input {...field} type="date" className="min-h-12 text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="validTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ważny do</FormLabel>
                <FormControl>
                  <Input {...field} type="date" className="min-h-12 text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maxUses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maks. użyć (puste = bez limitu)</FormLabel>
              <FormControl>
                <Input {...field} type="number" className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pickupPointId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punkt (pusty = wszystkie)</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base"
                >
                  <option value="">wszystkie punkty</option>
                  {points.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name}
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
          name="perUserOnce"
          render={({ field }) => (
            <FormItem>
              <label className="flex min-h-12 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="size-5"
                />
                Jeden raz na osobę
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
              <ActiveSwitch checked={field.value} onCheckedChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="min-h-12" disabled={saving}>
          {code ? "Zapisz" : "Dodaj kod"}
        </Button>
      </form>
    </Form>
  );
}
