import { describe, expect, it } from "vitest";

import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { buildRankedFeed } from "@/services/matching/feed";
import { RecordingNotificationChannel } from "@/services/notifications/recording-channel";
import { runNotificationScheduler } from "@/services/notifications/scheduler";

describe("notification scheduler safeguards", () => {
  it("delivers eligible reminders and deduplicates them for 48 hours", async () => {
    const repository = new MemoryRepository();
    await buildRankedFeed(repository, DEMO_USER_ID);
    const channel = new RecordingNotificationChannel();
    const first = await runNotificationScheduler(repository, { email: channel, sms: channel }, DEMO_USER_ID);
    expect(first.some((attempt) => attempt.status === "delivered")).toBe(true);
    const second = await runNotificationScheduler(repository, { email: channel, sms: channel }, DEMO_USER_ID);
    expect(second.every((attempt) => attempt.status === "skipped")).toBe(true);
  });
});
