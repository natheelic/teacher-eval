import { GitFork, ChevronDown } from "lucide-react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";

export function Connections() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Connections"
        description="Connect your {{APP_NAME}} account with other services."
      />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-[#030303] text-white">
              <GitFork className="size-4" />
            </span>
            <div className="flex min-w-0 flex-col items-start">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-[#030303]">GitHub</p>
                <span className="flex items-center rounded-full border border-[#16b674] bg-[#3fcf8e]/10 px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-[#097c4f]">
                  Connected
                </span>
              </div>
              <p className="text-[13px] font-medium text-[#696969]">
                Sync repos to {"{{APP_NAME}}"} projects for automatic branch creation
                and merging
              </p>
            </div>
          </div>
          <button className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
            Manage
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
