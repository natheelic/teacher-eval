import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";

function VersionField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <p className="text-[13px] font-medium text-[#030303]">{label}</p>
      <div className="flex h-[34px] w-full items-center rounded-md border border-black/8 bg-black/[0.01] px-3">
        <span className="text-[13px] font-medium text-[#696969]">{value}</span>
      </div>
    </div>
  );
}

export function ServiceVersions() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Service versions"
        description="Service versions and upgrade eligibility for your provisioned instance."
      />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-6 p-4">
          <VersionField label="Auth version" value="2.195.0" />
          <VersionField label="API version" value="13.0.5" />
          <VersionField label="Database version" value="17.6.1.054" />

          <div className="flex w-full flex-col items-start gap-1 rounded-lg border border-black/8 bg-black/[0.01] p-4">
            <p className="text-[13px] font-semibold text-[#030303]">
              Your project can be upgraded to the latest database version
            </p>
            <p className="text-[13px] font-medium text-[#464646]">
              The latest database version (17.6.1.155) is available for
              your project.
            </p>
            <button className="mt-2 flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95">
              Upgrade project
            </button>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
