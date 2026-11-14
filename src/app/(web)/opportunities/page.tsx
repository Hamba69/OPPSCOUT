import type { Metadata } from "next";

import { OpportunitiesBrowser } from "@/components/opportunities-browser";
import { requirePageAuth } from "@/lib/auth";
import { browseOpportunities } from "@/lib/opportunity-browse";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}): Promise<React.JSX.Element> {
  const [auth, params] = await Promise.all([requirePageAuth(["user"]), searchParams]);
  const { type = "", q = "" } = params;
  const now = new Date();

  // Load and rank every open opportunity once. Category, search, sort and paging then run in the browser,
  // so switching filters no longer reloads the page or re-runs matching on the server.
  const { items, categories } = await browseOpportunities(auth.userId, {}, now);

  return (
    <main className="animate-in flex flex-col gap-6">
      <header className="title-card">
        <h1>Opportunities</h1>
      </header>
      <OpportunitiesBrowser items={items} categories={categories} now={now} initialType={type} initialQuery={q.trim()} />
    </main>
  );
}
