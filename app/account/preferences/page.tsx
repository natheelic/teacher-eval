import { AccountHeader } from "@/components/account/AccountHeader";
import { SettingsSidebar } from "@/components/account/SettingsSidebar";
import { ProfileInformation } from "@/components/account/ProfileInformation";
import { SignInMethods } from "@/components/account/SignInMethods";
import { Connections } from "@/components/account/Connections";
import { AppearanceSettings } from "@/components/account/AppearanceSettings";
import { KeyboardShortcuts } from "@/components/account/KeyboardShortcuts";
import { DashboardSettings } from "@/components/account/DashboardSettings";
import { AnalyticsMarketing } from "@/components/account/AnalyticsMarketing";
import { DangerZone } from "@/components/account/DangerZone";
import { NoticeBanner } from "@/components/dashboard/NoticeBanner";
import { requireUser } from "@/lib/auth/require-session";
import {
  getConnections,
  getPreferences,
  getSignInMethods,
} from "@/lib/queries/account";
import { toIso } from "@/lib/format";

export default async function PreferencesPage() {
  // One batched fetch for the eight sections below.
  const [user, methods, connections, preferences] = await Promise.all([
    requireUser(),
    getSignInMethods(),
    getConnections(),
    getPreferences(),
  ]);

  // Disconnecting the last remaining sign-in method would lock the account out.
  const canDisconnect = user.hasPassword || methods.length > 1;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <AccountHeader />
      <div className="flex min-w-0 flex-1">
        <SettingsSidebar active="Preferences" />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-full max-w-[768px] flex-col gap-1 px-4 sm:px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-[#030303]">
                Preferences
              </h1>
              <p className="text-[15px] font-medium text-[#464646]">
                Manage your account profile, connections, and dashboard
                experience.
              </p>
            </div>

            <div className="flex w-full max-w-[768px] flex-col gap-16 px-4 pb-24 pt-12 sm:px-10">
              <ProfileInformation user={user} />
              <SignInMethods
                methods={methods}
                hasPassword={user.hasPassword}
              />
              <Connections
                connections={connections}
                canDisconnect={canDisconnect}
              />
              <AppearanceSettings
                theme={preferences.theme}
                sidebarBehavior={preferences.sidebarBehavior}
              />
              <KeyboardShortcuts shortcuts={preferences.keyboardShortcuts} />
              <DashboardSettings
                editEntitiesInCode={preferences.editEntitiesInCode}
                queueTableOperations={preferences.queueTableOperations}
              />
              <AnalyticsMarketing enabled={preferences.telemetryEnabled} />
              <DangerZone
                deletionRequestedAt={toIso(user.deletionRequestedAt)}
                hasPassword={user.hasPassword}
              />
            </div>
          </div>
        </main>
      </div>
      <NoticeBanner />
    </div>
  );
}
