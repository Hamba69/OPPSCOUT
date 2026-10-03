import { loadEnvConfig } from "@next/env";
import { getRepository } from "../../src/lib/repository";

loadEnvConfig(process.cwd());
async function main() {
  await (await getRepository()).retainTelemetry();
  console.log("Telemetry retention complete: daily rollups saved; request and vital samples older than 30 days and match runs older than 180 days removed.");
}
main().catch(() => { console.error("Telemetry retention failed; inspect database availability and migration status."); process.exitCode = 1; });
