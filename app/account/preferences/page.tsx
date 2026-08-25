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

export default function PreferencesPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <AccountHeader />
      <div className="flex flex-1">
        <SettingsSidebar active="Preferences" />
        <main className="flex-1 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-[768px] flex-col gap-1 px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-[#030303]">
                Preferences
              </h1>
              <p className="text-[15px] font-medium text-[#464646]">
                Manage your account profile, connections, and dashboard
                experience.
              </p>
            </div>

            <div className="flex w-[768px] flex-col gap-16 px-10 pb-24 pt-12">
              <ProfileInformation />
              <SignInMethods />
              <Connections />
              <AppearanceSettings />
              <KeyboardShortcuts />
              <DashboardSettings />
              <AnalyticsMarketing />
              <DangerZone />
            </div>
          </div>
        </main>
      </div>
      <NoticeBanner />
    </div>
  );
}
