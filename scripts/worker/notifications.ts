import { getRepository } from "@/lib/repository";
import { ResendEmailChannel } from "@/services/notifications/email/resend-email-channel";
import { AfricasTalkingSmsChannel } from "@/services/notifications/sms/africas-talking-sms-channel";
import { runNotificationWorker } from "@/services/notifications/worker";

async function main(): Promise<void> {
  const repository = await getRepository();
  const email = new ResendEmailChannel(async (userId) => (await repository.getProfile(userId))?.email ?? null);
  const sms = new AfricasTalkingSmsChannel(async (userId) => (await repository.getProfile(userId))?.phone ?? null);
  const attempts = await runNotificationWorker(repository, { email, sms });
  const failures = attempts.filter((attempt) => attempt.status === "failed");
  console.log(JSON.stringify({ attempts: attempts.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

void main();
