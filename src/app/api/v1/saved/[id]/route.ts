import { apiHandler, noContent } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    await (await getRepository()).deleteSaved(auth.userId, id);
    return noContent();
  });
}
