import { createClient } from "@/lib/supabase/admin";

import type { EmailKind } from "@/lib/email/delivery";

export type EmailLogStatus = "sent" | "failed" | "skipped";

const ERROR_MAX = 500;

export function clipEmailError(value: string): string {
  return value.slice(0, ERROR_MAX);
}

export function emailErrorText(error: unknown): string {
  if (error instanceof Error) {
    return clipEmailError(error.message || "Nie udało się wysłać maila.");
  }
  if (typeof error === "string") {
    return clipEmailError(error || "Nie udało się wysłać maila.");
  }
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return clipEmailError(error.message || "Nie udało się wysłać maila.");
  }
  return "Nie udało się wysłać maila.";
}

export async function recordEmailLog(input: {
  orderId?: string | null;
  kind: EmailKind;
  recipient: string;
  status: EmailLogStatus;
  providerId?: string | null;
  error?: string | null;
}): Promise<void> {
  try {
    const admin = createClient();
    const { error } = await admin.from("email_log").insert({
      order_id: input.orderId ?? null,
      kind: input.kind,
      recipient: input.recipient,
      status: input.status,
      provider_id: input.providerId ?? null,
      error: input.error ? clipEmailError(input.error) : null,
    });
    if (error) {
      console.error("[EMAIL]", "Nie udało się zapisać dziennika.", error.message);
    }
  } catch (err) {
    console.error("[EMAIL]", "Nie udało się zapisać dziennika.", err);
  }
}

export async function hasSentEmail(orderId: string, kind: EmailKind): Promise<boolean> {
  try {
    const admin = createClient();
    const { data, error } = await admin
      .from("email_log")
      .select("id")
      .eq("order_id", orderId)
      .eq("kind", kind)
      .eq("status", "sent")
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[EMAIL]", "Nie udało się sprawdzić dziennika.", error.message);
      return false;
    }
    return Boolean(data);
  } catch (err) {
    console.error("[EMAIL]", "Nie udało się sprawdzić dziennika.", err);
    return false;
  }
}
