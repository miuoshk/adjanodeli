"use server";

import { z } from "zod";

import { getSession } from "@/lib/auth";
import { invoicePayload, isCompleteInvoice } from "@/lib/orders/invoice";
import { payOrder } from "@/lib/orders/pay-order";
import { createServerClient } from "@/lib/supabase/server";

const placeOrderSchema = z.object({
  pickupPointId: z.string().uuid(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1),
      }),
    )
    .min(1)
    .max(30),
  note: z.string().max(200).default(""),
  voucherId: z.string().uuid().nullable().optional(),
  discountCode: z.string().min(1).max(40).nullable().optional(),
  invoice: z
    .object({
      requested: z.boolean(),
      nip: z.string(),
      company: z.string(),
      address: z.string(),
    })
    .optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; orderId: string; url: string }
  | { ok: false; code: "OUT_OF_STOCK"; productId: string; remaining: number }
  | { ok: false; code: "LEAD_TIME"; productId: string; earliestDate: string; message: string }
  | {
      ok: false;
      code:
        | "DATE_NOT_AVAILABLE"
        | "POINT_NOT_AVAILABLE"
        | "POINT_FORBIDDEN"
        | "INVALID_ITEMS"
        | "NOT_AUTHENTICATED"
        | "VOUCHER_INVALID"
        | "DISCOUNT_INVALID"
        | "TOTAL_BELOW_MINIMUM"
        | "INVALID_INVOICE"
        | "UNKNOWN";
      message: string;
    };

const errorMessages = {
  DATE_NOT_AVAILABLE: "Ten dzień nie jest już dostępny. Wybierz inny.",
  POINT_NOT_AVAILABLE: "Ten punkt nie obsługuje wybranego dnia.",
  POINT_FORBIDDEN: "Nie masz dostępu do tego punktu.",
  INVALID_ITEMS: "Sprawdź pozycje w koszyku.",
  NOT_AUTHENTICATED: "Zaloguj się, żeby zamówić.",
  VOUCHER_INVALID: "Ten voucher już nie działa. Wybierz inny albo zamów bez.",
  DISCOUNT_INVALID: "Ten kod już nie działa. Sprawdź go albo zamów bez.",
  TOTAL_BELOW_MINIMUM: "Po rabacie zamówienie musi mieć min. 2,00 zł. Dodaj jeszcze produkt.",
  INVALID_INVOICE: "Sprawdź NIP, nazwę i adres do faktury.",
  UNKNOWN: "Nie udało się złożyć zamówienia. Spróbuj jeszcze raz.",
} as const;

function parseRpcError(text: string): PlaceOrderResult {
  const outOfStock = text.match(/OUT_OF_STOCK:([0-9a-f-]{36}):(\d+)/i);
  if (outOfStock) {
    return {
      ok: false,
      code: "OUT_OF_STOCK",
      productId: outOfStock[1],
      remaining: Number.parseInt(outOfStock[2], 10),
    };
  }

  const leadTime = text.match(/LEAD_TIME:([0-9a-f-]{36}):(\d{4}-\d{2}-\d{2})/i);
  if (leadTime) {
    return {
      ok: false,
      code: "LEAD_TIME",
      productId: leadTime[1],
      earliestDate: leadTime[2],
      message: `Ten produkt pieczemy na zamówienie. Najbliższy odbiór: ${leadTime[2]}.`,
    };
  }

  if (text.includes("DATE_NOT_AVAILABLE")) {
    return { ok: false, code: "DATE_NOT_AVAILABLE", message: errorMessages.DATE_NOT_AVAILABLE };
  }
  if (text.includes("POINT_NOT_AVAILABLE")) {
    return { ok: false, code: "POINT_NOT_AVAILABLE", message: errorMessages.POINT_NOT_AVAILABLE };
  }
  if (text.includes("POINT_FORBIDDEN")) {
    return { ok: false, code: "POINT_FORBIDDEN", message: errorMessages.POINT_FORBIDDEN };
  }
  if (text.includes("INVALID_ITEMS")) {
    return { ok: false, code: "INVALID_ITEMS", message: errorMessages.INVALID_ITEMS };
  }
  if (text.includes("NOT_AUTHENTICATED")) {
    return { ok: false, code: "NOT_AUTHENTICATED", message: errorMessages.NOT_AUTHENTICATED };
  }
  if (text.includes("VOUCHER_INVALID")) {
    return { ok: false, code: "VOUCHER_INVALID", message: errorMessages.VOUCHER_INVALID };
  }
  if (text.includes("DISCOUNT_INVALID")) {
    return { ok: false, code: "DISCOUNT_INVALID", message: errorMessages.DISCOUNT_INVALID };
  }
  if (text.includes("TOTAL_BELOW_MINIMUM")) {
    return { ok: false, code: "TOTAL_BELOW_MINIMUM", message: errorMessages.TOTAL_BELOW_MINIMUM };
  }
  if (text.includes("INVALID_INVOICE")) {
    return { ok: false, code: "INVALID_INVOICE", message: errorMessages.INVALID_INVOICE };
  }

  return { ok: false, code: "UNKNOWN", message: errorMessages.UNKNOWN };
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false, code: "NOT_AUTHENTICATED", message: errorMessages.NOT_AUTHENTICATED };
  }

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_ITEMS", message: errorMessages.INVALID_ITEMS };
  }

  const invoice = parsed.data.invoice;
  if (invoice && !isCompleteInvoice(invoice)) {
    return { ok: false, code: "INVALID_INVOICE", message: errorMessages.INVALID_INVOICE };
  }

  const supabase = await createServerClient();
  const pInvoice = invoice ? invoicePayload(invoice) : null;
  const { data, error } = await supabase.rpc("create_order", {
    p_pickup_point_id: parsed.data.pickupPointId,
    p_pickup_date: parsed.data.pickupDate,
    p_items: parsed.data.items.map((item) => ({
      product_id: item.productId,
      qty: item.qty,
    })),
    p_note: parsed.data.note,
    p_discount: parsed.data.discountCode
      ? { code: parsed.data.discountCode }
      : parsed.data.voucherId
        ? { voucher_id: parsed.data.voucherId }
        : null,
    p_invoice: pInvoice ?? undefined,
  });

  if (error) {
    const text = [error.message, error.details, error.hint].filter(Boolean).join(" ");
    return parseRpcError(text);
  }

  if (!data) {
    return { ok: false, code: "UNKNOWN", message: errorMessages.UNKNOWN };
  }

  if (pInvoice) {
    await supabase
      .from("profiles")
      .update({
        invoice_defaults: {
          nip: pInvoice.nip,
          company: pInvoice.company,
          address: pInvoice.address,
        },
      })
      .eq("id", session.user.id);
  }

  const pay = await payOrder(data);
  if (pay.ok) {
    return { ok: true, orderId: data, url: pay.url };
  }

  return { ok: true, orderId: data, url: `/zamowienie/${data}` };
}
