import { AccountHeader } from "@/components/account/AccountHeader";
import { SettingsSidebar } from "@/components/account/SettingsSidebar";
import { AccessTokensTable } from "@/components/account/AccessTokensTable";
import { NoticeBanner } from "@/components/dashboard/NoticeBanner";
import { getApiTokens } from "@/lib/queries/account";

export default async function AccessTokensPage() {
  const tokens = await getApiTokens();

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <AccountHeader />
      <div className="flex min-w-0 flex-1">
        <SettingsSidebar active="Access Tokens" />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-full max-w-[768px] flex-col gap-1 px-4 sm:px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-[#030303]">
                Access Tokens
              </h1>
              <p className="text-[15px] font-medium text-[#464646]">
                Manage personal access tokens used to authenticate with the API.
              </p>
            </div>

            <div className="flex w-full max-w-[768px] flex-col gap-16 px-4 pb-24 pt-12 sm:px-10">
              <AccessTokensTable tokens={tokens} />
            </div>
          </div>
        </main>
      </div>
      <NoticeBanner />
    </div>
  );
}
