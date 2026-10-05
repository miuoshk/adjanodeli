function warsawMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** True from 17:45 through 18:59 Europe/Warsaw. */
export function isWarsawDailyReminderWindow(now = new Date()): boolean {
  const minutes = warsawMinutes(now);
  return minutes >= 17 * 60 + 45 && minutes <= 18 * 60 + 59;
}
