import { z } from "zod";

import { NotFoundError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";

const preferencesSchema = z.object({
  preferredChannel: z.enum(["web", "email", "sms", "ussd"]),
  secondaryChannels: z.array(z.enum(["web", "email", "sms", "ussd"])).max(4),
  notificationsEnabled: z.boolean(),
}).strict();

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const profile = await (await getRepository()).getProfile(auth.userId);
    if (!profile) throw new NotFoundError("Profile");
    return success({ preferredChannel: profile.preferredChannel, secondaryChannels: profile.secondaryChannels, notificationsEnabled: profile.notificationsEnabled });
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, preferencesSchema);
    const profile = await (await getRepository()).updateProfile(auth.userId, input);
    return success({ preferredChannel: profile.preferredChannel, secondaryChannels: profile.secondaryChannels, notificationsEnabled: profile.notificationsEnabled });
  });
}
