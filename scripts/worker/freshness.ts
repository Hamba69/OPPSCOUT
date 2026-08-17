import { getRepository } from "@/lib/repository";
import { refreshOpportunityLifecycle } from "@/services/ingestion/freshness";

async function main(): Promise<void> {
  const result = await refreshOpportunityLifecycle(await getRepository());
  console.log(JSON.stringify(result, null, 2));
}

void main();
