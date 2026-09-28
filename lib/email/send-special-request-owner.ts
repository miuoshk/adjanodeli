import { recordEmailLog } from "@/lib/email/log";
import { sendEmail } from "@/lib/email/resend";
import { SpecialRequestOwnerEmail } from "@/lib/email/templates/special-request-owner";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { createClient } from "@/lib/supabase/admin";

type SendSpecialRequestInput = {
  name: string | null;
  phone: string | null;
  email: string | null;
  wantedDate: string | null;
  description: string;
};

export async function sendSpecialRequestOwner(
  input: SendSpecialRequestInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const admin = createClient();
    const { data: settings } = await admin
      .from("settings")
      .select("owner_email, owner_phone")
      .eq("id", 1)
      .single();

    if (!settings?.owner_email) {
      const message = "Brak adresu właściciela.";
      console.error("[EMAIL]", message);
      await recordEmailLog({
        kind: "special_request_owner",
        recipient: "(brak adresu)",
        status: "failed",
        error: message,
      });
      return { ok: false, message };
    }

    return sendEmail({
      to: settings.owner_email,
      subject: "Nowe zamówienie specjalne",
      kind: "special_request_owner",
      react: SpecialRequestOwnerEmail({
        name: input.name,
        phone: input.phone,
        email: input.email,
        wantedDateLabel: input.wantedDate
          ? formatDatePl(parseDateOnly(input.wantedDate))
          : null,
        description: input.description,
        ownerPhone: settings.owner_phone,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się wysłać maila.";
    console.error("[EMAIL]", err);
    await recordEmailLog({
      kind: "special_request_owner",
      recipient: "(brak adresu)",
      status: "failed",
      error: message,
    });
    return { ok: false, message };
  }
}
