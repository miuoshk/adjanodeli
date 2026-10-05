export const DAILY_REMINDER_CONSENT =
  "Chcę dostawać maila o 18:00 w dni przed odbiorem z przypomnieniem, że można zamówić na jutro. Mogę to wyłączyć w każdej chwili jednym kliknięciem w mailu albo na koncie.";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function reminderPromptVisible(input: {
  dailyReminder: boolean;
  promptedAt: string | null;
  now?: Date;
}): boolean {
  if (input.dailyReminder) {
    return false;
  }
  if (!input.promptedAt) {
    return true;
  }
  const prompted = new Date(input.promptedAt).getTime();
  if (Number.isNaN(prompted)) {
    return true;
  }
  const now = input.now ?? new Date();
  return now.getTime() - prompted >= THIRTY_DAYS_MS;
}
