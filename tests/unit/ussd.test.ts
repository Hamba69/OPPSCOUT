import { describe, expect, it } from "vitest";
import { USSD_RULES } from "@/config/ussd-rules";
import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { RecordingNotificationChannel } from "@/services/notifications/recording-channel";
import { hashUssdPin, MemoryUssdCredentialStore } from "@/ussd/auth";
import { formatUssdScreen } from "@/ussd/character-budget";
import { UssdMenuService } from "@/ussd/menu-tree";
import { MemoryUssdSessionStore } from "@/ussd/session-store";

describe("USSD accessibility", () => {
  it("resumes a dropped profile flow from the last persisted keypress", async () => {
    const repository = new MemoryRepository(); const sessions = new MemoryUssdSessionStore(); const credentials = new MemoryUssdCredentialStore(); await credentials.set({ phoneNumber: "+256700000001", userId: DEMO_USER_ID, pinHash: hashUssdPin("1234") });
    const first = new UssdMenuService(repository, sessions, credentials, new RecordingNotificationChannel());
    expect((await first.handle({ sessionId: "drop-1", phoneNumber: "+256700000001", text: "" })).message).toContain("PIN");
    await first.handle({ sessionId: "drop-1", phoneNumber: "+256700000001", text: "1234" });
    await first.handle({ sessionId: "drop-1", phoneNumber: "+256700000001", text: "1234*1" });
    await first.handle({ sessionId: "drop-1", phoneNumber: "+256700000001", text: "1234*1*bachelors" });
    const resumed = new UssdMenuService(repository, sessions, credentials, new RecordingNotificationChannel());
    const result = await resumed.handle({ sessionId: "drop-1", phoneNumber: "+256700000001", text: "1234*1*bachelors*computer science" });
    expect(result.message).toContain("Current location"); expect((await sessions.get("drop-1"))?.draft.educationLevel).toBe("bachelors");
    await resumed.handle({ sessionId: "drop-1", phoneNumber: "+256700000001", text: "1234*1*bachelors*computer science*Kampala" });
    await resumed.handle({ sessionId: "drop-1", phoneNumber: "+256700000001", text: "1234*1*bachelors*computer science*Kampala*1,3" });
    expect((await repository.getProfile(DEMO_USER_ID))?.opportunityCategories).toEqual(["internship", "job"]);
  });

  it("keeps every real-data match screen inside the character budget", async () => {
    const repository = new MemoryRepository(); const sessions = new MemoryUssdSessionStore(); const credentials = new MemoryUssdCredentialStore(); await credentials.set({ phoneNumber: "+256700000001", userId: DEMO_USER_ID, pinHash: hashUssdPin("1234") }); const service = new UssdMenuService(repository, sessions, credentials, new RecordingNotificationChannel());
    await service.handle({ sessionId: "budget-1", phoneNumber: "+256700000001", text: "1234" }); const result = await service.handle({ sessionId: "budget-1", phoneNumber: "+256700000001", text: "1234*2" }); const formatted = formatUssdScreen(result.continueSession, result.message);
    expect(formatted.length).toBeLessThanOrEqual(USSD_RULES.characterBudget); expect(formatted.endsWith("...") || formatted.includes("0 Back")).toBe(true);
  });

  it("supports save, SMS-link, deadline and preference branches", async () => {
    const repository = new MemoryRepository(); const sessions = new MemoryUssdSessionStore(); const credentials = new MemoryUssdCredentialStore(); const sms = new RecordingNotificationChannel(); await credentials.set({ phoneNumber: "+256700000001", userId: DEMO_USER_ID, pinHash: hashUssdPin("1234") }); const service = new UssdMenuService(repository, sessions, credentials, sms);
    await service.handle({ sessionId: "full-1", phoneNumber: "+256700000001", text: "1234" }); await service.handle({ sessionId: "full-1", phoneNumber: "+256700000001", text: "1234*3" }); await service.handle({ sessionId: "full-1", phoneNumber: "+256700000001", text: "1234*3*1" }); const done = await service.handle({ sessionId: "full-1", phoneNumber: "+256700000001", text: "1234*3*1*1" });
    expect(done.completed).toBe(true); expect((await repository.listSaved(DEMO_USER_ID))).toHaveLength(1); expect(sms.sent).toHaveLength(1);
    await service.handle({ sessionId: "full-2", phoneNumber: "+256700000001", text: "1234" }); const deadlines = await service.handle({ sessionId: "full-2", phoneNumber: "+256700000001", text: "1234*4" }); expect(deadlines.message).toMatch(/Internship|Scholarship/);
    await service.handle({ sessionId: "full-3", phoneNumber: "+256700000001", text: "1234" }); await service.handle({ sessionId: "full-3", phoneNumber: "+256700000001", text: "1234*5" }); await service.handle({ sessionId: "full-3", phoneNumber: "+256700000001", text: "1234*5*2" }); await service.handle({ sessionId: "full-3", phoneNumber: "+256700000001", text: "1234*5*2*3" }); expect((await repository.getProfile(DEMO_USER_ID))?.notificationFrequency).toBe("weekly");
  });
});
