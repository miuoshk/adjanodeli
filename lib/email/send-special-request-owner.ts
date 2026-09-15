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
): Promise<{ ok: true } | { ok: false }> {
  try {
    const admin = createClient();
    const { data: settings } = await admin
      .from("settings")
      .select("owner_email, owner_phone")
      .eq("id", 1)
      .single();

    if (!settings?.owner_email) {
      console.error("[EMAIL]", "Brak owner_email do special-request-owner.");
      return { ok: false };
    }

    return sendEmail({
      to: settings.owner_email,
      subject: "Nowe zamówienie specjalne",
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
    console.error("[EMAIL]", err);
    return { ok: false };
  }
}
