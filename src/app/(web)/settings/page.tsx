import { SettingsForm } from "@/components/settings-form";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await (await getRepository()).getProfile(userId);
  return <main className="page-shell animate-in"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Alert settings</h1><SettingsForm channel={profile?.preferredChannel ?? "email"} secondaryChannels={profile?.secondaryChannels ?? []} frequency={profile?.notificationFrequency ?? "instant"} enabled={profile?.notificationsEnabled ?? true} /><form action="/auth/logout" method="post" className="mt-6 max-w-xl"><button className="button-secondary w-full">Sign out</button></form></main>;
}
