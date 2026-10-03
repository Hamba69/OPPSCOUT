import { loadEnvConfig } from "@next/env";
import { createServiceRoleClient } from "@/lib/supabase/admin";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const db = createServiceRoleClient();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: pending, error } = await db.from("StoredDocument").select("id,storagePath").eq("status", "pending").lt("createdAt", cutoff);
  if (error) throw new Error(`Could not list pending documents: ${error.message}`);
  for (const document of pending ?? []) {
    await db.storage.from("profile-documents").remove([document.storagePath]);
    const { error: deleteError } = await db.from("StoredDocument").delete().eq("id", document.id);
    if (deleteError) throw new Error(`Could not delete pending document ${document.id}: ${deleteError.message}`);
  }
  console.log(`Removed ${pending?.length ?? 0} expired pending documents.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Document sweep failed.");
  process.exitCode = 1;
});
