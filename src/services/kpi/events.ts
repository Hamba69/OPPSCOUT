import type { EventType } from "@/core/entities/domain";
import type { Repository } from "@/lib/repository/types";

export async function recordEvent(
  repository: Repository,
  eventType: EventType,
  userId: string,
  opportunityId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await repository.writeEvent({ eventType, userId, opportunityId, metadata });
}
