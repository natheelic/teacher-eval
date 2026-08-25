import { Copy } from "lucide-react";
import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";

export function GeneralSettingsForm() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="General settings" description="" />
      <SettingsCard>
        <div className="flex w-full items-start gap-6 border-b border-black/8 p-4">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">Project name</label>
            <p className="text-[13px] font-medium text-[#696969]">
              Displayed throughout the dashboard.
            </p>
          </div>
          <input
            placeholder="my-project"
            className="h-[34px] w-[327px] shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30"
          />
        </div>
        <div className="flex w-full items-start gap-6 border-b border-black/8 p-4">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">Project ID</label>
            <p className="text-[13px] font-medium text-[#696969]">
              Reference used in APIs and URLs.
            </p>
          </div>
          <div className="flex h-[34px] w-[327px] shrink-0 items-center justify-between rounded-md border border-black/8 bg-black/[0.01] pl-3 pr-1">
            <span className="truncate text-[13px] font-medium text-[#464646]">
              your-project-ref
            </span>
            <button className="flex h-6 items-center gap-1 rounded-md border border-black/15 bg-[#fdfdfd] px-2 text-xs font-medium text-[#030303] hover:bg-black/4">
              <Copy className="size-3.5" />
              Copy
            </button>
          </div>
        </div>
        <div className="flex w-full items-start gap-6 border-b border-black/8 p-4">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">Project region</label>
            <p className="text-[13px] font-medium text-[#696969]">
              US East (N. Virginia)
            </p>
          </div>
          <div className="flex h-[34px] w-[327px] shrink-0 items-center justify-between rounded-md border border-black/8 bg-black/[0.01] pl-3 pr-1">
            <span className="truncate text-[13px] font-medium text-[#464646]">
              us-east-1
            </span>
            <button className="flex h-6 items-center gap-1 rounded-md border border-black/15 bg-[#fdfdfd] px-2 text-xs font-medium text-[#030303] hover:bg-black/4">
              <Copy className="size-3.5" />
              Copy
            </button>
          </div>
        </div>
        <div className="flex w-full items-center justify-end p-4">
          <button
            disabled
            className="flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] opacity-50"
          >
            Save changes
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
