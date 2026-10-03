import { apiHandler } from "@/lib/api";
import { ADMIN_HEADERS, requireAdminPortalApi } from "@/lib/admin-portal";
import { DATASETS, isDataset, parseAdminQuery } from "@/lib/admin-data";
import { ADMIN_COLUMNS } from "@/lib/admin-columns";
import { AppError } from "@/core/errors/app-error";
import { getRepository } from "@/lib/repository";
import { requestIpHash } from "@/lib/privacy-hash";
import { CSV_BOM, csvRow } from "@/lib/csv";

export async function GET(request:Request,context:{params:Promise<{dataset:string}>}):Promise<Response>{return apiHandler(request,async()=>{
  requireAdminPortalApi(request);const {dataset}=await context.params;if(!isDataset(dataset))throw new AppError("Dataset not found.",404,"NOT_FOUND");
  const repository=await getRepository(),query: import("@/lib/admin-data").AdminQuery={...parseAdminQuery(dataset,new URL(request.url).searchParams),export:true};
  const columns=[...ADMIN_COLUMNS[DATASETS[dataset].table]!,...(dataset==="matches"?["userName","opportunityTitle"]:dataset==="organizations"?["listingCount"]:[])];
  const encoder=new TextEncoder(),ipHash=requestIpHash(request),userAgent=(request.headers.get("user-agent")??"").slice(0,200);let count=0,header=false,done=false;
  const audit=async(cancelled:boolean)=>{await repository.writeAdminAccessLog({event:"export",ipHash,userAgent,detail:{dataset,filterKeys:Object.keys(query.filters),hasSearch:Boolean(query.search),from:query.from??null,to:query.to??null,sort:query.sort,direction:query.direction,rowCount:count,cancelled}});};
  const stream=new ReadableStream<Uint8Array>({async pull(controller){try{if(!header){controller.enqueue(encoder.encode(CSV_BOM+csvRow(columns)));header=true;return;}if(done)return;const page=await repository.adminPage(dataset,query);controller.enqueue(encoder.encode(page.rows.map(row=>csvRow(columns.map(column=>row[column]))).join("")));count+=page.rows.length;const last=page.rows[page.rows.length-1];if(page.rows.length<1000 || !last){done=true;await audit(false);controller.close();return;}query.cursor={id:String(last.id),value:last[query.sort] as string | number | null};}catch(error){done=true;controller.error(error);}},async cancel(){if(!done){done=true;await audit(true);}}});
  const timestamp=new Date().toISOString().replace(/[-:]/g,"").replace("T","-").slice(0,13);
  return new Response(stream,{headers:{...ADMIN_HEADERS,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="oppscout-${dataset}-${timestamp}.csv"`}});
});}
