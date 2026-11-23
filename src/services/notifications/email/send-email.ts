import { AppError } from "@/core/errors/app-error";

/** One plain-text email through Resend, the provider the alert emails already use. */
export async function sendEmail(to: string, subject: string, text: string, fetcher: typeof fetch = fetch): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.OPPSCOUT_EMAIL_FROM;
  if (!apiKey || !from) throw new AppError("Email provider is not configured.", 503, "EMAIL_NOT_CONFIGURED");
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) throw new AppError("Email delivery provider rejected the message.", 502, "EMAIL_PROVIDER_ERROR", { status: response.status, detail: await response.text() });
}
