import { AccountHeader } from "@/components/account/AccountHeader";
import { SettingsSidebar } from "@/components/account/SettingsSidebar";
import { AuditLogsTable } from "@/components/account/AuditLogsTable";

export default async function AuditLogsPage({
  searchParams,
}: PageProps<"/account/audit-logs">) {
  // Next 16: searchParams is a Promise.
  const params = await searchParams;

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface">
      <AccountHeader />
      <div className="flex min-w-0 flex-1">
        <SettingsSidebar active="Audit Logs" />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-full flex-col gap-1 px-4 sm:px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-foreground">
                Audit Logs
              </h1>
              <p className="text-[15px] font-medium text-foreground-secondary">
                View a detailed history of account activities and changes.
              </p>
            </div>

            <div className="flex w-full flex-col px-4 pb-24 pt-12 sm:px-10">
              <AuditLogsTable searchParams={params} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
