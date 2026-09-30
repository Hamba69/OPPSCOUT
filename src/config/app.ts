import { AppError } from "@/core/errors/app-error";

const productionAppUrl = "https://oppscout-delta.vercel.app";

export function appUrl(): string {
  const configured = process.env.OPPSCOUT_APP_URL;
  if (configured) {
    const normalized = configured.replace(/\/$/, "");
    try {
      const hostname = new URL(normalized).hostname;
      if (["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return productionAppUrl;
    } catch {
      return normalized;
    }
    return normalized;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.NODE_ENV === "production") throw new AppError("The public application URL is not configured.", 503, "APP_URL_NOT_CONFIGURED");
  return productionAppUrl;
}
