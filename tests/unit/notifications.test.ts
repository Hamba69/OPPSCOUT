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
    const first = await runNotificationScheduler(repository, { app: channel, email: channel, sms: channel }, DEMO_USER_ID);
    expect(first.some((attempt) => attempt.status === "delivered")).toBe(true);
    const second = await runNotificationScheduler(repository, { app: channel, email: channel, sms: channel }, DEMO_USER_ID);
    expect(second.every((attempt) => attempt.status === "skipped")).toBe(true);
  });

  it("sends daily digests across opted-in channels", async () => {
    const repository = new MemoryRepository();
    await repository.updateProfile(DEMO_USER_ID, { notificationFrequency: "daily", preferredChannel: "web", secondaryChannels: ["sms"] });
    await buildRankedFeed(repository, DEMO_USER_ID);
    const channel = new RecordingNotificationChannel();
    const attempts = await runNotificationScheduler(repository, { app: channel, email: channel, sms: channel }, DEMO_USER_ID);
    expect(attempts.map((item) => item.channel)).toEqual(expect.arrayContaining(["app", "sms"]));
    expect(attempts.every((item) => item.triggerKey.startsWith("digest:daily:"))).toBe(true);
  });

  it("sends saved-opportunity change alerts regardless of digest frequency", async () => {
    const repository = new MemoryRepository();
    const matches = await buildRankedFeed(repository, DEMO_USER_ID);
    const match = matches[0];
    expect(match).toBeDefined();
    await repository.saveOpportunity(DEMO_USER_ID, match!.opportunityId);
    await repository.updateProfile(DEMO_USER_ID, { notificationFrequency: "weekly", preferredChannel: "web", secondaryChannels: [] });
    await repository.updateOpportunity(match!.opportunityId, { checkedAt: new Date(match!.createdAt.getTime() + 1_000) });
    const channel = new RecordingNotificationChannel();
    const attempts = await runNotificationScheduler(repository, { app: channel, email: channel, sms: channel }, DEMO_USER_ID);
    expect(attempts.some((item) => item.triggerKey.includes(":major-change:"))).toBe(true);
  });
});
