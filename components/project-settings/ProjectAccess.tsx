import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";

export type ProjectAccessProps = {
  orgMemberCount: number;
  members: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isYou: boolean;
  }[];
};

export function ProjectAccess({ orgMemberCount, members }: ProjectAccessProps) {
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
              All {orgMemberCount} organization{" "}
              {orgMemberCount === 1 ? "member" : "members"} can access this
              project.
            </p>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="flex w-full min-w-[420px] items-center border-b border-black/8 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.6px] text-[#696969]">
            <span className="flex-1">Member</span>
            <span className="w-32">Role</span>
          </div>
          {members.map((member, i) => (
            <div
              key={member.id}
              className={`flex w-full min-w-[420px] items-center px-4 py-3 ${
                i < members.length - 1 ? "border-b border-black/8" : ""
              }`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-[13px] font-medium text-[#030303]">
                  {member.email}
                </span>
                {member.isYou && (
                  <span className="flex shrink-0 items-center rounded-full border border-black/15 bg-white px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-[#464646]">
                    You
                  </span>
                )}
              </span>
              <span className="w-32 shrink-0 text-[13px] font-medium text-[#464646]">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}
