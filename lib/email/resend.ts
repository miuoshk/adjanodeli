import { Resend } from "resend";
import type { ReactElement } from "react";

type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
};

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: true } | { ok: false }> {
  try {
    const from = process.env.EMAIL_FROM;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !from) {
      console.error("[EMAIL]", "Brak RESEND_API_KEY albo EMAIL_FROM.");
      return { ok: false };
    }

    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: input.to,
      subject: input.subject,
      react: input.react,
    });

    if (error) {
      console.error("[EMAIL]", error);
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error("[EMAIL]", err);
    return { ok: false };
  }
}
