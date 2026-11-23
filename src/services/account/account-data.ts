import "server-only";

import { AppError } from "@/core/errors/app-error";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type Row = Record<string, unknown>;
type Db = ReturnType<typeof createServiceRoleClient>;

function rows(result: { data: Row[] | null; error: { message: string } | null }, what: string): Row[] {
  if (result.error) throw new Error(`Could not read ${what}: ${result.error.message}`);
  return result.data ?? [];
}

/**
 * Everything OppScout holds about one seeker, as plain JSON: their profile, saved list, matches,
 * notifications, activity, feedback, uploaded document details and which organisations viewed them.
 * Moderation data about listings and organisations' private notes are not personal data of the seeker.
 */
export async function exportAccountData(userId: string, email: string | null, now = new Date()): Promise<Row> {
  const db = createServiceRoleClient();
  const [profile, saved, matches, notifications, events, feedback, documents, viewedBy, posted] = await Promise.all([
    db.from("UserProfile").select("*").eq("id", userId).maybeSingle(),
    db.from("SavedOpportunity").select("id,opportunityId,status,createdAt,updatedAt,Opportunity(title,organizationName)").eq("userId", userId),
    db.from("MatchResult").select("opportunityId,score,matchedFactors,missingFactors,createdAt,Opportunity(title,organizationName)").eq("userId", userId),
    db.from("Notification").select("channel,message,status,sentAt").eq("userId", userId),
    db.from("EventLog").select("eventType,opportunityId,timestamp").eq("userId", userId),
    db.from("Feedback").select("category,rating,message,createdAt").eq("userId", userId),
    db.from("StoredDocument").select("title,description,purpose,originalFileName,mimeType,sizeBytes,status,shareWithOrganizations,createdAt").eq("ownerType", "user").eq("ownerId", userId),
    db.from("SeekerAccessLog").select("organizationId,opportunityId,action,createdAt").eq("seekerId", userId),
    db.from("Opportunity").select("id,title,organizationName,category,location,deadline,status,verificationStatus,publicationDate,submitterContact").eq("submittedBy", userId),
  ]);
  if (profile.error) throw new Error(`Could not read profile: ${profile.error.message}`);
  const profileRow = { ...(profile.data ?? {}) } as Row;
  // Credentials never leave the server, even to their owner.
  for (const key of Object.keys(profileRow)) if (/pin|hash|token|secret/i.test(key)) delete profileRow[key];
  return {
    exportedAt: now.toISOString(),
    account: { id: userId, email },
    profile: profile.data ? profileRow : null,
    savedOpportunities: rows(saved as never, "saved opportunities"),
    matches: rows(matches as never, "matches"),
    notifications: rows(notifications as never, "notifications"),
    activity: rows(events as never, "activity"),
    feedback: rows(feedback as never, "feedback"),
    documents: rows(documents as never, "documents"),
    organizationsThatViewedYourProfile: rows(viewedBy as never, "profile views"),
    opportunitiesYouPosted: rows(posted as never, "posted opportunities"),
  };
}

/**
 * Organisations where this person is the only one with publisher access. Deleting the account would
 * leave nobody able to manage those listings, so deletion waits until access is handed over.
 */
export function soleManagedOrganizations(userId: string, organizations: Array<{ id: string; name: string; dashboardUsers: string[] }>): Array<{ id: string; name: string }> {
  return organizations.filter((item) => item.dashboardUsers.includes(userId) && item.dashboardUsers.every((user) => user === userId)).map(({ id, name }) => ({ id, name }));
}

async function check(promise: PromiseLike<{ error: { message: string } | null }>, what: string): Promise<void> {
  const { error } = await promise;
  if (error) throw new Error(`Could not delete ${what}: ${error.message}`);
}

async function removeDocuments(db: Db, userId: string): Promise<void> {
  const documents = rows(await db.from("StoredDocument").select("id,storagePath").eq("ownerType", "user").eq("ownerId", userId) as never, "documents");
  const paths = documents.map((item) => String(item.storagePath));
  if (paths.length) {
    const { error } = await db.storage.from("profile-documents").remove(paths);
    if (error) throw new Error(`Could not delete uploaded files: ${error.message}`);
  }
  await check(db.from("StoredDocument").delete().eq("ownerType", "user").eq("ownerId", userId), "document records");
}

/**
 * Permanently deletes a seeker's account. Personal rows go (profile, and with it matches, notifications
 * and saved items by cascade; uploaded files; organisations' access log and pipeline entries about them).
 * Anonymous analytics stay, with the user link cleared by the database (EventLog, Feedback, MatchRun).
 * The sign-in account is deleted last, so a failure part way leaves the person able to sign in and retry.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const db = createServiceRoleClient();
  const organizations = rows(await db.from("Organization").select("id,name,dashboardUsers").contains("dashboardUsers", [userId]) as never, "publisher access") as Array<{ id: string; name: string; dashboardUsers: string[] }>;
  const sole = soleManagedOrganizations(userId, organizations);
  if (sole.length) {
    throw new AppError(`You are the only person managing ${sole.map((item) => item.name).join(", ")}. Add another publisher or contact OppScout before deleting your account.`, 409, "SOLE_PUBLISHER");
  }
  await removeDocuments(db, userId);
  await check(db.from("SeekerAccessLog").delete().eq("seekerId", userId), "profile view history");
  await check(db.from("SeekerPipelineEntry").delete().eq("seekerId", userId), "publisher shortlists");
  // Listings they posted stay up (others may be applying), but no longer point to them or hold their contact details.
  await check(db.from("Opportunity").update({ submittedBy: null, submitterContact: null }).eq("submittedBy", userId), "poster details on listings");
  for (const organization of organizations) {
    await check(db.from("Organization").update({ dashboardUsers: organization.dashboardUsers.filter((user) => user !== userId) }).eq("id", organization.id), "publisher access");
  }
  await check(db.from("UserProfile").delete().eq("id", userId), "profile");
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Could not delete the sign-in account: ${error.message}`);
}
