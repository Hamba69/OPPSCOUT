import { z } from "zod";
import { NotFoundError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { hashUssdPin } from "@/ussd/auth";
import { getUssdCredentialStore } from "@/ussd/stores";
const schema = z.object({ userId: z.string().uuid(), pin: z.string().regex(/^\d{4,6}$/) }).strict();
export async function POST(request: Request): Promise<Response> { return apiHandler(async () => { const auth = await requireAuth(request); requireRole(auth, ["admin"]); const input = await parseJson(request, schema); const profile = await (await getRepository()).getProfile(input.userId); if (!profile?.phone) throw new NotFoundError("Profile phone"); await getUssdCredentialStore().set({ userId: profile.id, phoneNumber: profile.phone, pinHash: hashUssdPin(input.pin) }); return success({ userId: profile.id, phoneNumber: profile.phone }, 201); }); }
