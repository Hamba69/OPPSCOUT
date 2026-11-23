import { AppError, ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import type { Opportunity, SubmitterContact } from "@/core/entities/domain";
import type { AuthContext } from "@/lib/auth";
import type { Repository } from "@/lib/repository/types";
import { containsSuspiciousRequest } from "@/services/trust/checklist";

/** Posts waiting for review per member. Stops one account flooding the review queue. */
export const MAX_PENDING_POSTS_PER_MEMBER = 5;

export interface MemberPostInput {
  title: string;
  organizationName: string;
  category: string;
  description: string;
  eligibility: Opportunity["eligibility"];
  requiredSkills: string[];
  preferredSkills: string[];
  location: string;
  workMode: Opportunity["workMode"];
  deadline: Date | null;
  applicationMethod: string;
  sourceUrl: string;
  submitterContact: SubmitterContact;
}

/**
 * Who may manage a listing: the member who posted it, or (for listings from the old publisher accounts)
 * someone with access to that organisation. Admins manage everything through the review tools.
 */
export function ownsListing(auth: Pick<AuthContext, "userId" | "organizationId">, opportunity: Pick<Opportunity, "submittedBy" | "organizationId" | "origin">): boolean {
  if (opportunity.submittedBy && opportunity.submittedBy === auth.userId) return true;
  return opportunity.origin === "organization" && auth.organizationId !== null && opportunity.organizationId === auth.organizationId;
}

/** A member's own listings: their posts plus any from an old publisher account they belong to. */
export async function listOwnListings(repository: Repository, auth: Pick<AuthContext, "userId" | "organizationId">): Promise<Opportunity[]> {
  const [posted, legacy] = await Promise.all([
    repository.listOpportunities({ submittedBy: auth.userId }),
    auth.organizationId ? repository.listOpportunities({ organizationId: auth.organizationId, origin: "organization" }) : Promise.resolve([]),
  ]);
  const byId = new Map([...posted, ...legacy].map((item) => [item.id, item]));
  return [...byId.values()].sort((a, b) => b.publicationDate.getTime() - a.publicationDate.getTime());
}

/**
 * Anyone signed in can post. Every post waits for review (or is flagged straight away if it asks
 * applicants for money or sensitive data), and is never matched to seekers until a reviewer approves it.
 * A blank closing date means "open until filled".
 */
export async function submitMemberOpportunity(repository: Repository, userId: string, input: MemberPostInput): Promise<Opportunity> {
  const waiting = (await repository.listOpportunities({ submittedBy: userId, verificationStatus: "pending" })).length;
  if (waiting >= MAX_PENDING_POSTS_PER_MEMBER) {
    throw new AppError(`You already have ${waiting} posts waiting for review. Please wait for those to be checked before posting more.`, 429, "TOO_MANY_PENDING_POSTS");
  }
  const suspicious = containsSuspiciousRequest(`${input.title} ${input.description} ${input.applicationMethod}`);
  return repository.createOpportunity({
    ...input,
    organizationId: null,
    deadlineType: input.deadline ? "fixed" : "rolling",
    origin: "community",
    source: "org_submitted",
    verificationStatus: suspicious ? "flagged" : "pending",
    status: "open",
    submittedBy: userId,
  });
}

/**
 * The owner's edit. It always goes back to review; a listing that was sent back or removed is
 * resubmitted. Wording that asks for fees or sensitive data keeps it flagged.
 */
export async function updateMemberOpportunity(repository: Repository, auth: Pick<AuthContext, "userId" | "organizationId">, id: string, input: Partial<MemberPostInput>): Promise<Opportunity> {
  const current = await repository.getOpportunity(id);
  if (!current) throw new NotFoundError("Opportunity");
  if (!ownsListing(auth, current)) throw new ForbiddenError();
  const merged = { ...current, ...input };
  const suspicious = containsSuspiciousRequest(`${merged.title} ${merged.description} ${merged.applicationMethod}`);
  return repository.updateOpportunity(id, {
    ...input,
    ...(input.deadline !== undefined ? { deadlineType: input.deadline ? "fixed" as const : "rolling" as const } : {}),
    verificationStatus: suspicious ? "flagged" : "pending",
    ...(!suspicious && current.status === "removed" ? { status: "open" as const } : {}),
  });
}
