export const NOTIFICATION_RULES = {
  highFitScore: 75,
  reminderFitScore: 60,
  deadlineWindowsHours: [168, 72, 24],
  deduplicationWindowHours: 48,
  defaultDailyCap: 3,
  digestInactiveDays: 7,
} as const;

export function notificationDailyCap(): number {
  const configured = Number(process.env.NOTIFICATION_DAILY_CAP);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : NOTIFICATION_RULES.defaultDailyCap;
}
