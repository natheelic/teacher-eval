import { AccountHeader } from "@/components/account/AccountHeader";
import { SettingsSidebar } from "@/components/account/SettingsSidebar";
import { AuditLogsTable } from "@/components/account/AuditLogsTable";
import { NoticeBanner } from "@/components/dashboard/NoticeBanner";

export default function AuditLogsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <AccountHeader />
      <div className="flex flex-1">
        <SettingsSidebar active="Audit Logs" />
        <main className="flex-1 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-[1200px] flex-col gap-1 px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-[#030303]">
                Audit Logs
              </h1>
              <p className="text-[15px] font-medium text-[#464646]">
                View a detailed history of account activities and changes.
              </p>
            </div>

            <div className="flex w-[1200px] flex-col px-10 pb-24 pt-12">
              <AuditLogsTable />
            </div>
          </div>
        </main>
      </div>
      <NoticeBanner />
    </div>
  );
}
