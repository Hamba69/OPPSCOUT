import { SettingsForm } from "@/components/settings-form";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await (await getRepository()).getProfile(userId);
  return <main className="page-shell animate-in"><h1 className="text-2xl font-extrabold text-ink sm:text-4xl">Alert settings</h1><p className="mt-1 text-navy">Choose how and when we notify you about new matches and closing dates.</p><SettingsForm channel={profile?.preferredChannel ?? "email"} secondaryChannels={profile?.secondaryChannels ?? []} frequency={profile?.notificationFrequency ?? "instant"} enabled={profile?.notificationsEnabled ?? true} /></main>;
}
