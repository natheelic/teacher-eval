import { ChevronDown, Pause } from "lucide-react";
import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";

export function ProjectAvailability() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Project availability"
        description="Restart or pause your project when performing maintenance"
      />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col items-start">
            <p className="text-[13px] font-medium text-[#030303]">Restart project</p>
            <p className="text-[13px] font-medium text-[#464646]">
              Your project will not be available for a few minutes.
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <button className="flex h-[26px] items-center justify-center rounded-l-md border border-black/15 bg-[#fdfdfd] px-3 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
              Restart project
            </button>
            <button className="flex h-[26px] items-center justify-center rounded-r-md border border-l-0 border-black/15 bg-[#fdfdfd] px-1.5 py-1 hover:bg-black/4">
              <ChevronDown className="size-3.5 text-[#464646]" />
            </button>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col items-start">
            <p className="text-[13px] font-medium text-[#030303]">Pause project</p>
            <p className="text-[13px] font-medium text-[#464646]">
              Your project will not be accessible while it is paused.
            </p>
          </div>
          <button className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
            <Pause className="size-3.5" />
            Pause project
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
