import { AccountHeader } from "@/components/account/AccountHeader";
import { SettingsSidebar } from "@/components/account/SettingsSidebar";
import { SecuritySettings } from "@/components/account/SecuritySettings";
import { requireUser } from "@/lib/auth/require-session";
import { getDeviceSessions } from "@/lib/queries/account";

export default async function SecurityPage() {
  const [user, sessions] = await Promise.all([
    requireUser(),
    getDeviceSessions(),
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <AccountHeader />
      <div className="flex min-w-0 flex-1">
        <SettingsSidebar active="Security" />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-full max-w-[768px] flex-col gap-1 px-4 sm:px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-[#030303]">
                Security
              </h1>
              <p className="text-[15px] font-medium text-[#464646]">
                Manage your password, two-factor authentication, and active sessions.
              </p>
            </div>

            <div className="flex w-full max-w-[768px] flex-col gap-16 px-4 pb-24 pt-12 sm:px-10">
              <SecuritySettings
                hasPassword={user.hasPassword}
                twoFactorEnabled={user.twoFactorEnabled}
                sessions={sessions}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
