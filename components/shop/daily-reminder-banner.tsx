import { DailyReminderAsk } from "@/components/shop/daily-reminder-ask";
import { getProfile } from "@/lib/auth";
import { reminderPromptVisible } from "@/lib/reminders/consent";

export async function DailyReminderBanner() {
  const profile = await getProfile();
  if (!profile) {
    return null;
  }
  if (
    !reminderPromptVisible({
      dailyReminder: profile.daily_reminder,
      promptedAt: profile.daily_reminder_prompted_at,
    })
  ) {
    return null;
  }
  return <DailyReminderAsk variant="banner" />;
}
