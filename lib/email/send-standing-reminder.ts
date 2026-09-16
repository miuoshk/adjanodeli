import { sendEmail } from "@/lib/email/resend";
import { StandingReminderEmail } from "@/lib/email/templates/standing-reminder";
import { formatDatePl, formatPrice } from "@/lib/format";
import { parseDateOnly } from "@/lib/dates";

type ReminderItem = {
  name: string;
  qty: number;
  unitPriceGrosze: number;
};

export async function sendStandingReminder(input: {
  to: string;
  standingName: string;
  pickupDate: string;
  items: ReminderItem[];
  orderUrl: string;
  ownerPhone: string | null;
}): Promise<{ ok: true } | { ok: false }> {
  const total = input.items.reduce((sum, item) => sum + item.unitPriceGrosze * item.qty, 0);

  return sendEmail({
    to: input.to,
    subject: "Zamówić jak zwykle na jutro?",
    react: StandingReminderEmail({
      standingName: input.standingName,
      pickupDateLabel: formatDatePl(parseDateOnly(input.pickupDate)),
      items: input.items.map((item) => ({
        name: item.name,
        qty: item.qty,
        lineTotal: formatPrice(item.unitPriceGrosze * item.qty),
      })),
      total: formatPrice(total),
      orderUrl: input.orderUrl,
      ownerPhone: input.ownerPhone,
    }),
  });
}
