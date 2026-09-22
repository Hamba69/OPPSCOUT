import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

export async function createAdmin(args: string[]): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || url.includes("your-project") || !key || key === "your-service-role-key") {
    throw new Error("Set real NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values before running admin:create.");
  }
  if (args.length !== 1 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args[0])) {
    throw new Error("Usage: npm run admin:create -- <email>");
  }
  const email = args[0].trim().toLowerCase();
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Unable to look up user (${error.code ?? error.status ?? "Auth error"}). Check the service role key and Supabase availability.`);
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) {
      const { error: updateError } = await client.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, role: "admin" },
      });
      if (updateError) throw new Error(`Unable to grant admin role (${updateError.code ?? updateError.status ?? "Auth error"}).`);
      return `Admin role granted to ${email}. Have the user sign out and sign in again to refresh their session.`;
    }
    if (data.users.length < perPage) break;
  }
  throw new Error(`No user exists with email ${email}. Have that person sign up first, then rerun this command.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // tsx does not load Next.js environment files; explicit shell variables take precedence.
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  void createAdmin(process.argv.slice(2)).then(console.log).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin provisioning failed.");
    process.exitCode = 1;
  });
}
