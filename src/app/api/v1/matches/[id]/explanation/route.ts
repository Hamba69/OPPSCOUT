import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const match = await (await getRepository()).getMatch(auth.userId, id);
    if (!match) throw new NotFoundError("Match");
    if (!match.matchedFactors.length || !match.missingFactors.length) throw new ValidationError("Stored match explanation is incomplete.");
    return success({ score: match.score, matchedFactors: match.matchedFactors, missingFactors: match.missingFactors, generatedBy: match.generatedBy });
  });
}
