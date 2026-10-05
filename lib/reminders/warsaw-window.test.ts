import { describe, expect, it } from "vitest";

import { reminderPromptVisible } from "@/lib/reminders/consent";
import { isWarsawDailyReminderWindow } from "@/lib/reminders/warsaw-window";

describe("daily reminder window", () => {
  it("is open at 18:10 Warsaw in summer and winter", () => {
    expect(isWarsawDailyReminderWindow(new Date("2026-06-15T16:10:00Z"))).toBe(true);
    expect(isWarsawDailyReminderWindow(new Date("2026-01-15T17:10:00Z"))).toBe(true);
  });

  it("opens at 17:45 and closes at 19:00", () => {
    expect(isWarsawDailyReminderWindow(new Date("2026-06-15T15:45:00Z"))).toBe(true);
    expect(isWarsawDailyReminderWindow(new Date("2026-06-15T15:44:00Z"))).toBe(false);
    expect(isWarsawDailyReminderWindow(new Date("2026-06-15T16:59:00Z"))).toBe(true);
    expect(isWarsawDailyReminderWindow(new Date("2026-06-15T17:00:00Z"))).toBe(false);
  });
});

describe("reminder prompt", () => {
  const now = new Date("2026-10-06T16:00:00Z");

  it("asks only when the customer has not decided, then waits 30 days", () => {
    expect(reminderPromptVisible({ dailyReminder: false, promptedAt: null, now })).toBe(true);
    expect(reminderPromptVisible({ dailyReminder: true, promptedAt: null, now })).toBe(false);
    expect(
      reminderPromptVisible({
        dailyReminder: false,
        promptedAt: "2026-10-05T16:00:00Z",
        now,
      }),
    ).toBe(false);
    expect(
      reminderPromptVisible({
        dailyReminder: false,
        promptedAt: "2026-09-01T16:00:00Z",
        now,
      }),
    ).toBe(true);
  });
});
