import { AccountHeader } from "@/components/account/AccountHeader";
import { SettingsSidebar } from "@/components/account/SettingsSidebar";
import { ProfileInformation } from "@/components/account/ProfileInformation";
import { Connections } from "@/components/account/Connections";
import { AppearanceSettings } from "@/components/account/AppearanceSettings";
import { DangerZone } from "@/components/account/DangerZone";
import { requireUser } from "@/lib/auth/require-session";
import { getConnections, getPreferences } from "@/lib/queries/account";
import { toIso } from "@/lib/format";
import { emailEnabled } from "@/lib/env";

export default async function PreferencesPage() {
  // One batched fetch for the four sections below.
  const [user, connections, preferences] = await Promise.all([
    requireUser(),
    getConnections(),
    getPreferences(),
  ]);

  // Disconnecting the last remaining sign-in method would lock the account
  // out — safe only with a password set, or more than one provider linked.
  const linkedCount = connections.filter((c) => c.connected).length;
  const canDisconnect = user.hasPassword || linkedCount > 1;

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface">
      <AccountHeader />
      <div className="flex min-w-0 flex-1">
        <SettingsSidebar active="Preferences" />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-full max-w-[768px] flex-col gap-1 px-4 sm:px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-foreground">
                Preferences
              </h1>
              <p className="text-[15px] font-medium text-foreground-secondary">
                Manage your account profile, connections, and appearance.
              </p>
            </div>

            <div className="flex w-full max-w-[768px] flex-col gap-16 px-4 pb-24 pt-12 sm:px-10">
              <ProfileInformation
                user={{
                  ...user,
                  emailVerified: Boolean(user.emailVerified),
                }}
                canResendVerification={emailEnabled}
              />
              <Connections
                connections={connections}
                canDisconnect={canDisconnect}
              />
              <AppearanceSettings theme={preferences.theme} userId={user.id} />
              <DangerZone
                deletionRequestedAt={toIso(user.deletionRequestedAt)}
                hasPassword={user.hasPassword}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
