import { AppError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository, isMemoryDataMode } from "@/lib/repository";
import { RecordingNotificationChannel } from "@/services/notifications/recording-channel";
import { ResendEmailChannel } from "@/services/notifications/email/resend-email-channel";
import { AfricasTalkingSmsChannel } from "@/services/notifications/sms/africas-talking-sms-channel";
import { runNotificationScheduler } from "@/services/notifications/scheduler";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    if (!isMemoryDataMode()) requireRole(auth, ["admin"]);
    const repository = await getRepository();
    const resolveEmail = async (userId: string): Promise<string | null> => (await repository.getProfile(userId))?.email ?? null;
    const resolvePhone = async (userId: string): Promise<string | null> => (await repository.getProfile(userId))?.phone ?? null;
    const channel = new RecordingNotificationChannel();
    const channels = isMemoryDataMode()
      ? { email: channel, sms: channel }
      : { email: new ResendEmailChannel(resolveEmail), sms: new AfricasTalkingSmsChannel(resolvePhone) };
    const userId = new URL(request.url).searchParams.get("userId") ?? auth.userId;
    if (auth.role !== "admin" && userId !== auth.userId) throw new AppError("Cannot run notifications for another user.", 403, "FORBIDDEN");
    return success(await runNotificationScheduler(repository, channels, userId));
  });
}
