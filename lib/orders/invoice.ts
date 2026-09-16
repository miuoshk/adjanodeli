import { z } from "zod";

import { isValidNip, normalizeNip } from "@/lib/validation/nip";

export type InvoiceDefaults = {
  nip: string;
  company: string;
  address: string;
};

const defaultsSchema = z.object({
  nip: z.string(),
  company: z.string(),
  address: z.string(),
});

export function parseInvoiceDefaults(value: unknown): InvoiceDefaults | null {
  const parsed = defaultsSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return {
    nip: parsed.data.nip,
    company: parsed.data.company,
    address: parsed.data.address,
  };
}

export function invoicePayload(input: {
  requested: boolean;
  nip: string;
  company: string;
  address: string;
}): { requested: true; nip: string; company: string; address: string } | null {
  if (!input.requested) {
    return null;
  }
  return {
    requested: true,
    nip: normalizeNip(input.nip),
    company: input.company.trim(),
    address: input.address.trim(),
  };
}

export function isCompleteInvoice(input: {
  requested: boolean;
  nip: string;
  company: string;
  address: string;
}): boolean {
  if (!input.requested) {
    return true;
  }
  return (
    isValidNip(input.nip) && input.company.trim().length > 0 && input.address.trim().length > 0
  );
}
