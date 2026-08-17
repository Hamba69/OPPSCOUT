import type { Repository } from "@/lib/repository/types";
import type { ChannelRegistry, DeliveryAttempt } from "@/services/notifications/scheduler";
import { runNotificationScheduler } from "@/services/notifications/scheduler";

export async function runNotificationWorker(repository: Repository, channels: ChannelRegistry, now = new Date()): Promise<DeliveryAttempt[]> {
  const profiles = await repository.listProfiles();
  const batches = await Promise.all(
    profiles.filter((profile) => profile.notificationsEnabled).map((profile) => runNotificationScheduler(repository, channels, profile.id, now)),
  );
  return batches.flat();
}
