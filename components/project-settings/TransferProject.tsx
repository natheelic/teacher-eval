import { ArrowRightLeft } from "lucide-react";
import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";

export function TransferProject() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="Transfer project" description="" />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ArrowRightLeft className="mt-0.5 size-5 shrink-0 text-[#464646]" />
            <div className="flex min-w-0 max-w-[489px] flex-col items-start">
              <p className="text-[13px] font-medium text-[#030303]">
                Transfer project to another organization
              </p>
              <p className="text-[13px] font-medium text-[#464646]">
                To transfer projects, the owner must be a member of both the
                source and target organizations.
              </p>
            </div>
          </div>
          <button className="flex h-[26px] shrink-0 items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
            Transfer project
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
