import { SettingsForm } from "@/components/settings-form";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await (await getRepository()).getProfile(userId);
  return <main className="page-shell"><p className="eyebrow">Quiet when it should be</p><h1 className="mt-2 text-4xl font-black">Alert settings</h1><SettingsForm channel={profile?.preferredChannel ?? "email"} enabled={profile?.notificationsEnabled ?? true} /></main>;
}
