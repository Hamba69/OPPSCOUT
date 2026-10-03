import { z } from "zod";
import { apiHandler, noContent } from "@/lib/api";
import { ADMIN_HEADERS, requireAdminPortalApi, requireSameOrigin } from "@/lib/admin-portal";
import { feedbackUpdateSchema } from "@/lib/admin-data";
import { getRepository } from "@/lib/repository";
import { requestIpHash } from "@/lib/privacy-hash";
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}):Promise<Response>{const response=await apiHandler(request,async()=>{requireAdminPortalApi(request);requireSameOrigin(request);const {id}=await context.params;z.string().uuid().parse(id);const input=feedbackUpdateSchema.parse(await request.json()),repository=await getRepository();await repository.updateFeedback(id,input);await repository.writeAdminAccessLog({event:"feedback_update",ipHash:requestIpHash(request),userAgent:(request.headers.get("user-agent")??"").slice(0,200),detail:{feedbackId:id,status:input.status,noteChanged:true}});return noContent();});for(const [key,value]of Object.entries(ADMIN_HEADERS))response.headers.set(key,value);return response;}
