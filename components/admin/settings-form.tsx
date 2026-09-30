"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { WEEKDAYS, timeInputValue } from "@/lib/admin/catalog";
import { saveSettings } from "@/lib/admin/owner-actions";
import type { OwnerSettings } from "@/lib/admin/owner-queries";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { labelCustomerLines, type LabelCustomerInfo } from "@/lib/labels/customer-info";

const schema = z.object({
  bakeryName: z.string().min(1, "Podaj nazwę."),
  cutoffTime: z.string().min(1, "Podaj cutoff."),
  orderWeekdays: z.array(z.number()).min(1, "Zaznacz dni zamówień."),
  maxDaysAhead: z.coerce.number().int().min(1, "Przynajmniej 1 dzień."),
  pendingOrderTtlMinutes: z.coerce.number().int().min(30, "Musi być ≥ 30, bo Stripe."),
  maxQtyPerItem: z.coerce.number().int().min(1, "Przynajmniej 1 szt."),
  ownerEmail: z.string().email("Podaj e-mail."),
  ownerPhone: z.string(),
  customerCancellationEnabled: z.boolean(),
  labelCustomerInfo: z.enum(["masked", "masked_email", "full"]),
});

type FormValues = z.infer<typeof schema>;

export function SettingsForm({ settings }: { settings: OwnerSettings }) {
  const [closedDates, setClosedDates] = useState(
    [...settings.closed_dates].map((day) => day.slice(0, 10)).sort(),
  );
  const [newClosed, setNewClosed] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bakeryName: settings.bakery_name ?? "Adjano Deli",
      cutoffTime: timeInputValue(settings.cutoff_time),
      orderWeekdays: settings.order_weekdays,
      maxDaysAhead: settings.max_days_ahead,
      pendingOrderTtlMinutes: settings.pending_order_ttl_minutes,
      maxQtyPerItem: settings.max_qty_per_item,
      ownerEmail: settings.owner_email,
      ownerPhone: settings.owner_phone ?? "",
      customerCancellationEnabled: settings.customer_cancellation_enabled,
      labelCustomerInfo:
        settings.label_customer_info === "masked" || settings.label_customer_info === "full"
          ? settings.label_customer_info
          : "masked_email",
    },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const result = await saveSettings({
        ...values,
        orderWeekdays: [...values.orderWeekdays].sort((a, b) => a - b),
        closedDates,
      });
      if (!result.ok) {
        toast(result.message);
        return;
      }
      toast("Ustawienia zapisane.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="bakeryName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazwa</FormLabel>
              <FormControl>
                <Input {...field} className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cutoffTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cutoff</FormLabel>
              <FormControl>
                <Input {...field} type="time" className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orderWeekdays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dni zamówień</FormLabel>
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
          name="maxDaysAhead"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ile dni do przodu</FormLabel>
              <FormControl>
                <Input {...field} type="number" min={1} className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Dni zamknięte</p>
          {closedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak świąt i urlopów.</p>
          ) : (
            <ul className="space-y-2">
              {closedDates.map((day) => (
                <li
                  key={day}
                  className="flex min-h-12 items-center justify-between rounded-md border border-[var(--adj-cream-dark)] bg-card px-3"
                >
                  <span>{formatDatePl(parseDateOnly(day))}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-10"
                    onClick={() => setClosedDates((current) => current.filter((value) => value !== day))}
                  >
                    Usuń
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Input
              type="date"
              value={newClosed}
              onChange={(event) => setNewClosed(event.target.value)}
              className="min-h-12 max-w-56 text-base"
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-12"
              onClick={() => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(newClosed)) {
                  return;
                }
                setClosedDates((current) =>
                  current.includes(newClosed) ? current : [...current, newClosed].sort(),
                );
                setNewClosed("");
              }}
            >
              Dodaj datę
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="pendingOrderTtlMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Czas na płatność (minuty)</FormLabel>
              <FormDescription>Musi być ≥ 30, bo tyle żyje sesja Stripe.</FormDescription>
              <FormControl>
                <Input {...field} type="number" min={30} className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxQtyPerItem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max sztuk jednego produktu</FormLabel>
              <FormControl>
                <Input {...field} type="number" min={1} className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerCancellationEnabled"
          render={({ field }) => (
            <FormItem>
              <label className="flex min-h-12 items-center gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="size-5 shrink-0"
                />
                Klient może anulować do cutoff dnia przed odbiorem
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ownerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail właścicielki</FormLabel>
              <FormControl>
                <Input {...field} type="email" className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ownerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl>
                <Input {...field} className="min-h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="labelCustomerInfo"
          render={({ field }) => (
            <FormItem>
              <section className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
                <h2 className="text-2xl font-semibold">Etykiety</h2>
                <div className="space-y-2">
                  {(
                    [
                      ["masked", "Skrócone imię i nazwisko"],
                      ["masked_email", "Skrócone imię i nazwisko + skrócony e-mail"],
                      ["full", "Pełne dane"],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="flex min-h-12 items-center gap-3 text-base">
                      <input
                        type="radio"
                        name={field.name}
                        value={value}
                        checked={field.value === value}
                        onChange={() => field.onChange(value)}
                        className="size-5 shrink-0"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <LabelPreview mode={field.value} />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Paczki stoją w punktach, gdzie widzą je inni. Pełne dane wybierz tylko, jeśli naprawdę ich
                  potrzebujesz.
                </p>
              </section>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="min-h-12" disabled={saving}>
          Zapisz ustawienia
        </Button>
      </form>
    </Form>
  );
}

const PREVIEW_NAME = "Justyna Kowalska";
const PREVIEW_EMAIL = "justyna@gmail.com";

function LabelPreview({ mode }: { mode: LabelCustomerInfo }) {
  const customer = labelCustomerLines(mode, PREVIEW_NAME, PREVIEW_EMAIL);
  return (
    <div className="max-w-[75mm] overflow-hidden rounded-md border border-[var(--adj-cream-dark)] bg-white p-3 text-[var(--adj-ink)]">
      <p className="font-mono text-2xl font-bold tracking-wide">AB12</p>
      <p className="truncate text-sm font-semibold">{customer.name}</p>
      {customer.email ? <p className="truncate text-xs">{customer.email}</p> : null}
      <p className="truncate text-xs">Sąd Rejonowy · czwartek, 1 października</p>
      <p className="mt-1 text-xs">2× Chleb żytni</p>
      <p className="mt-2 text-[10px]">#1043</p>
    </div>
  );
}
