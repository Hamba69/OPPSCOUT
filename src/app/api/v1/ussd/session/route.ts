import { AppError, ValidationError } from "@/core/errors/app-error";
import { apiHandler } from "@/lib/api";
import { getRepository, isMemoryDataMode } from "@/lib/repository";
import { AfricasTalkingSmsChannel } from "@/services/notifications/sms/africas-talking-sms-channel";
import { RecordingNotificationChannel } from "@/services/notifications/recording-channel";
import { formatUssdScreen } from "@/ussd/character-budget";
import { UssdMenuService } from "@/ussd/menu-tree";
import { recordUssdOutcome } from "@/ussd/metrics";
import { getUssdCredentialStore, getUssdSessionStore } from "@/ussd/stores";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const expected = process.env.AFRICASTALKING_USSD_WEBHOOK_SECRET; if (!isMemoryDataMode() && (!expected || request.headers.get("x-oppscout-ussd-secret") !== expected)) throw new AppError("Invalid USSD gateway signature.", 401, "USSD_GATEWAY_UNAUTHORIZED");
    const body = await request.formData(); const sessionId = body.get("sessionId"); const phoneNumber = body.get("phoneNumber"); const text = body.get("text");
    if (typeof sessionId !== "string" || typeof phoneNumber !== "string" || typeof text !== "string") throw new ValidationError("sessionId, phoneNumber and text are required.");
    const repository = await getRepository(); const sms = isMemoryDataMode() ? new RecordingNotificationChannel() : new AfricasTalkingSmsChannel(async (userId) => (await repository.getProfile(userId))?.phone ?? null);
    const result = await new UssdMenuService(repository, getUssdSessionStore(), getUssdCredentialStore(), sms).handle({ sessionId, phoneNumber, text });
    if (result.completed) recordUssdOutcome(true);
    return new Response(formatUssdScreen(result.continueSession, result.message), { headers: { "content-type": "text/plain; charset=utf-8" } });
  });
}
