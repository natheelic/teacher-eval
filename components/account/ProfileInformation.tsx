import { ChevronDown } from "lucide-react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";

export function ProfileInformation() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="Profile information" description="" />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">First name</label>
          </div>
          <input
            placeholder="First name"
            className="h-[34px] w-full shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#696969] outline-none focus:border-black/30 sm:w-[262px]"
          />
        </div>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">Last name</label>
          </div>
          <input
            placeholder="Last name"
            className="h-[34px] w-full shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#696969] outline-none focus:border-black/30 sm:w-[262px]"
          />
        </div>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">Primary email</label>
            <p className="text-[13px] font-medium text-[#696969]">
              Used for account notifications
            </p>
          </div>
          <button className="flex h-[34px] w-full shrink-0 items-center justify-between rounded-md border border-black/15 px-3 text-[13px] font-medium text-[#030303] hover:bg-black/[0.02] sm:w-[262px]">
            you@example.com
            <ChevronDown className="size-4 text-[#696969]" />
          </button>
        </div>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">Username</label>
            <p className="text-[13px] font-medium text-[#696969]">
              Display name used across dashboard
            </p>
          </div>
          <input
            placeholder="username"
            className="h-[34px] w-full shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30 sm:w-[262px]"
          />
        </div>
        <div className="flex w-full items-center justify-end p-4">
          <button
            disabled
            className="flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] opacity-50"
          >
            Save
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
