import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }): Promise<React.JSX.Element> {
  const { returnTo } = await searchParams;
  return <ResetPasswordForm returnTo={returnTo === "/settings" ? "/settings" : "/feed"} />;
}
