import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";

export function ProjectAccess() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="Project access" description="" />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col items-start">
            <p className="text-[13px] font-medium text-[#030303]">
              Organization-wide access
            </p>
            <p className="text-[13px] font-medium text-[#464646]">
              All 1 organization members can access this project.
            </p>
          </div>
          <button className="flex h-[26px] shrink-0 items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
            Manage members
          </button>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="flex w-full min-w-[420px] items-center border-b border-black/8 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.6px] text-[#696969]">
            <span className="flex-1">Member</span>
            <span className="w-32">Role</span>
          </div>
          <div className="flex w-full min-w-[420px] items-center px-4 py-3">
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-[13px] font-medium text-[#030303]">
                you@example.com
              </span>
              <span className="flex shrink-0 items-center rounded-full border border-black/15 bg-white px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-[#464646]">
                You
              </span>
            </span>
            <span className="w-32 shrink-0 text-[13px] font-medium text-[#464646]">
              Owner
            </span>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
