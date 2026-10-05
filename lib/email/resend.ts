import { Resend } from "resend";
import type { ReactElement } from "react";

import type { EmailKind } from "@/lib/email/delivery";
import { emailErrorText, recordEmailLog } from "@/lib/email/log";

type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
  kind: EmailKind;
  orderId?: string | null;
  headers?: Record<string, string>;
};

export type SendEmailResult = { ok: true } | { ok: false; message: string };

function missingConfigMessage(apiKey: string | undefined, from: string | undefined): string | null {
  if (!apiKey && !from) {
    return "Brak RESEND_API_KEY i EMAIL_FROM.";
  }
  if (!apiKey) {
    return "Brak RESEND_API_KEY.";
  }
  if (!from) {
    return "Brak EMAIL_FROM.";
  }
  return null;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM;
  const apiKey = process.env.RESEND_API_KEY;
  const missing = missingConfigMessage(apiKey, from);

  if (missing || !apiKey || !from) {
    console.error("[EMAIL]", missing);
    await recordEmailLog({
      orderId: input.orderId,
      kind: input.kind,
      recipient: input.to,
      status: "failed",
      error: missing ?? "Brak konfiguracji poczty.",
    });
    return { ok: false, message: missing ?? "Brak konfiguracji poczty." };
  }

  try {
    const { data, error } = await new Resend(apiKey).emails.send({
      from,
      to: input.to,
      subject: input.subject,
      react: input.react,
      headers: input.headers,
    });

    if (error) {
      const message = emailErrorText(error);
      console.error("[EMAIL]", error);
      await recordEmailLog({
        orderId: input.orderId,
        kind: input.kind,
        recipient: input.to,
        status: "failed",
        error: message,
      });
      return { ok: false, message };
    }

    await recordEmailLog({
      orderId: input.orderId,
      kind: input.kind,
      recipient: input.to,
      status: "sent",
      providerId: data?.id ?? null,
    });
    return { ok: true };
  } catch (err) {
    const message = emailErrorText(err);
    console.error("[EMAIL]", err);
    await recordEmailLog({
      orderId: input.orderId,
      kind: input.kind,
      recipient: input.to,
      status: "failed",
      error: message,
    });
    return { ok: false, message };
  }
}
