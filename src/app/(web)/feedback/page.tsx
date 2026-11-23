import type { Metadata } from "next";
import { cookies } from "next/headers";

import { FeedbackForm } from "@/components/feedback-form";
import { getOptionalAuth } from "@/lib/auth";
import { privacyHash } from "@/lib/privacy-hash";
import { getRepository } from "@/lib/repository";

export const metadata: Metadata = { title: "Share feedback" };
export const dynamic = "force-dynamic";

/**
 * Checks "already submitted?" while the page renders, in one query, instead of making the browser wait
 * for a second round trip. A visitor with no feedback cookie and no sign-in cannot have submitted yet.
 * The feedback cookie itself is set when they submit.
 */
async function initialFeedbackState(): Promise<"ready" | "already" | undefined> {
  try {
    const [jar, auth] = await Promise.all([cookies(), getOptionalAuth()]);
    const token = jar.get("oppscout_fb")?.value;
    const validToken = token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
    if (!validToken && !auth) return "ready";
    const repository = await getRepository();
    // A signed-in person without the cookie is matched on their account only; this hash matches nothing.
    const visitorHash = privacyHash(validToken ?? `no-visitor-cookie:${auth!.userId}`, "visitor");
    return await repository.hasFeedback(visitorHash, auth?.userId ?? null) ? "already" : "ready";
  } catch {
    return undefined; // The form falls back to asking the API.
  }
}

export default async function FeedbackPage(): Promise<React.JSX.Element> {
  return <main className="animate-in flex flex-col gap-6"><header className="title-card"><h1>Share feedback</h1></header><FeedbackForm initialState={await initialFeedbackState()} /></main>;
}
