import { AppError } from "@/core/errors/app-error";

export function appUrl(): string {
  const configured = process.env.OPPSCOUT_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.NODE_ENV === "production") throw new AppError("The public application URL is not configured.", 503, "APP_URL_NOT_CONFIGURED");
  return "http://127.0.0.1:3000";
}
