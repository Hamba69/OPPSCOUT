import { USSD_RULES } from "@/config/ussd-rules";
import type { NotificationChannel } from "@/core/interfaces/notification-channel";
import type { Repository } from "@/lib/repository/types";
import { buildRankedFeed } from "@/services/matching/feed";
import { issueUssdToken, verifyUssdPin, verifyUssdToken, type UssdCredentialStore } from "@/ussd/auth";
import type { UssdSessionStore } from "@/ussd/session-store";
import type { UssdScreen, UssdSession } from "@/ussd/types";

const MAIN = "OppScout\n1 Create/continue profile\n2 Check new matches\n3 Save opportunity\n4 Upcoming deadlines\n5 Notification settings";
const categories: Record<string, string> = { "1": "internship", "2": "scholarship", "3": "job", "4": "fellowship" };
function fresh(sessionId: string, phoneNumber: string): UssdSession { return { sessionId, phoneNumber, userId: null, token: null, step: "pin", attempts: 0, matchIds: [], selectedOpportunityId: null, draft: {}, updatedAt: new Date().toISOString() }; }
function latest(text: string): string { return text.split("*").filter(Boolean).at(-1)?.trim() ?? ""; }
function screen(message: string, continueSession = true, completed = false): UssdScreen { return { message, continueSession, completed }; }

export class UssdMenuService {
  public constructor(private readonly repository: Repository, private readonly sessions: UssdSessionStore, private readonly credentials: UssdCredentialStore, private readonly sms: NotificationChannel) {}
  public async handle(input: { sessionId: string; phoneNumber: string; text: string }): Promise<UssdScreen> {
    const value = latest(input.text); let session = await this.sessions.get(input.sessionId) ?? fresh(input.sessionId, input.phoneNumber);
    if (!session.userId || !session.token || !verifyUssdToken(session.token)) {
      if (!value) return this.persist(session, screen("Welcome to OppScout. Enter your 4-digit PIN:"));
      const credential = await this.credentials.get(input.phoneNumber); session.attempts += 1;
      if (!credential || !/^\d{4,6}$/.test(value) || !verifyUssdPin(value, credential.pinHash)) { if (session.attempts >= USSD_RULES.pinAttempts) { await this.sessions.delete(session.sessionId); return screen("Too many incorrect PIN attempts. Try again later.", false, true); } return this.persist(session, screen(`PIN not accepted. ${USSD_RULES.pinAttempts - session.attempts} tries left:`)); }
      session = { ...session, userId: credential.userId, token: issueUssdToken(credential.userId, input.phoneNumber), step: "main", attempts: 0 }; return this.persist(session, screen(MAIN));
    }
    if (!session.userId) return screen("Authentication expired. Start again.", false, true);
    if (session.step === "main") return this.main(session, value);
    if (session.step.startsWith("profile_")) return this.profile(session, value);
    if (session.step === "matches") { session.step = "main"; return this.persist(session, screen(MAIN)); }
    if (session.step === "save_choice") return this.saveChoice(session, value);
    if (session.step === "save_link") return this.saveLink(session, value);
    if (session.step === "deadlines") { session.step = "main"; return this.persist(session, screen(MAIN)); }
    if (session.step === "preferences") return this.preferences(session, value);
    if (session.step === "frequency") return this.frequency(session, value);
    session.step = "main"; return this.persist(session, screen(MAIN));
  }
  private async persist(session: UssdSession, result: UssdScreen): Promise<UssdScreen> { session.updatedAt = new Date().toISOString(); await this.sessions.set(session); return result; }
  private async main(session: UssdSession, value: string): Promise<UssdScreen> {
    if (!value) return this.persist(session, screen(MAIN));
    if (value === "1") { session.step = "profile_education"; return this.persist(session, screen("Education level (e.g. diploma, bachelors):")); }
    if (value === "2") return this.matches(session);
    if (value === "3") return this.saveMenu(session);
    if (value === "4") return this.deadlines(session);
    if (value === "5") { session.step = "preferences"; const profile = await this.repository.getProfile(session.userId!); return this.persist(session, screen(`Alerts: ${profile?.notificationsEnabled ? "ON" : "OFF"}\n1 Toggle\n2 Frequency\n0 Back`)); }
    return this.persist(session, screen(`Choose 1-5.\n${MAIN}`));
  }
  private async profile(session: UssdSession, value: string): Promise<UssdScreen> {
    if (!value) return this.persist(session, screen("Please enter a value."));
    if (session.step === "profile_education") { session.draft.educationLevel = value; session.step = "profile_field"; return this.persist(session, screen("Field of study:")); }
    if (session.step === "profile_field") { session.draft.fieldOfStudy = value; session.step = "profile_location"; return this.persist(session, screen("Current location:")); }
    if (session.step === "profile_location") { session.draft.location = value; session.step = "profile_categories"; return this.persist(session, screen("Choose up to 2: 1 Internship 2 Scholarship 3 Job 4 Fellowship (e.g. 1,3)")); }
    const selected = value.split(",").map((item) => categories[item.trim()]).filter((item): item is string => Boolean(item)).slice(0, 2); if (!selected.length) return this.persist(session, screen("Choose category numbers, e.g. 1,3:")); session.draft.opportunityCategories = selected;
    await this.repository.updateProfile(session.userId!, session.draft); session.step = "main"; session.draft = {}; return this.persist(session, screen(`Profile saved for ${selected.join(" and ")}.\n${MAIN}`));
  }
  private async matches(session: UssdSession): Promise<UssdScreen> { const matches = (await buildRankedFeed(this.repository, session.userId!)).slice(0, USSD_RULES.maxMatches); session.matchIds = matches.map((item) => item.opportunityId); session.step = "matches"; const lines = matches.map((item, index) => `${index + 1} ${item.opportunity?.title} - ${item.matchedFactors[0]?.detail} Closes ${item.opportunity?.deadline.toLocaleDateString("en-UG")}`); return this.persist(session, screen(lines.length ? `${lines.join("\n")}\n0 Back` : "No new verified matches.\n0 Back")); }
  private async saveMenu(session: UssdSession): Promise<UssdScreen> { const matches = (await buildRankedFeed(this.repository, session.userId!)).slice(0, USSD_RULES.maxMatches); session.matchIds = matches.map((item) => item.opportunityId); session.step = "save_choice"; return this.persist(session, screen(matches.length ? `${matches.map((item, index) => `${index + 1} ${item.opportunity?.title}`).join("\n")}\nChoose one to save:` : "No matches to save.\n0 Back")); }
  private async saveChoice(session: UssdSession, value: string): Promise<UssdScreen> { const opportunityId = session.matchIds[Number(value) - 1]; if (!opportunityId) return this.persist(session, screen("Choose a listed number:")); await this.repository.saveOpportunity(session.userId!, opportunityId); session.selectedOpportunityId = opportunityId; session.step = "save_link"; return this.persist(session, screen("Saved. SMS the official link?\n1 Yes\n2 No")); }
  private async saveLink(session: UssdSession, value: string): Promise<UssdScreen> { if (value === "1" && session.selectedOpportunityId) { const opportunity = await this.repository.getOpportunity(session.selectedOpportunityId); if (opportunity) await this.sms.send({ userId: session.userId!, message: `${opportunity.title}: ${opportunity.sourceUrl} Preferences: /settings`, priority: "normal" }); } await this.sessions.delete(session.sessionId); return screen("Saved. Check OppScout anytime for updates.", false, true); }
  private async deadlines(session: UssdSession): Promise<UssdScreen> { const saved = await this.repository.listSaved(session.userId!); const items = (await Promise.all(saved.filter((item) => item.status === "saved").map((item) => this.repository.getOpportunity(item.opportunityId)))).filter((item) => item !== null).sort((a, b) => a.deadline.getTime() - b.deadline.getTime()).slice(0, 3); session.step = "deadlines"; return this.persist(session, screen(items.length ? `${items.map((item) => `${item.title}: ${item.deadline.toLocaleDateString("en-UG")}`).join("\n")}\n0 Back` : "No saved deadlines.\n0 Back")); }
  private async preferences(session: UssdSession, value: string): Promise<UssdScreen> { if (value === "0") { session.step = "main"; return this.persist(session, screen(MAIN)); } const profile = await this.repository.getProfile(session.userId!); if (value === "1") { await this.repository.updateProfile(session.userId!, { notificationsEnabled: !profile?.notificationsEnabled }); session.step = "main"; return this.persist(session, screen(`Alerts ${profile?.notificationsEnabled ? "off" : "on"}.\n${MAIN}`)); } if (value === "2") { session.step = "frequency"; return this.persist(session, screen("Frequency\n1 Instant\n2 Daily\n3 Weekly")); } return this.persist(session, screen("Choose 1, 2 or 0:")); }
  private async frequency(session: UssdSession, value: string): Promise<UssdScreen> { const choices = { "1": "instant", "2": "daily", "3": "weekly" } as const; const frequency = choices[value as keyof typeof choices]; if (!frequency) return this.persist(session, screen("Choose 1, 2 or 3:")); await this.repository.updateProfile(session.userId!, { notificationFrequency: frequency }); session.step = "main"; return this.persist(session, screen(`Frequency set to ${frequency}.\n${MAIN}`)); }
}
