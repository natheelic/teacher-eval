import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";
import { UpgradeDatabaseButton } from "./UpgradeDatabaseButton";

export type ServiceVersionsProps = {
  projectId: string;
  versions: { authVersion: string; apiVersion: string; dbVersion: string };
  latestDbVersion: string;
  canUpgrade: boolean;
};

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

export function ServiceVersions({
  projectId,
  versions,
  latestDbVersion,
  canUpgrade,
}: ServiceVersionsProps) {
  // Computed on the server — no semver comparison in the component.
  const upgradeAvailable = versions.dbVersion !== latestDbVersion;

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Service versions"
        description="Service versions and upgrade eligibility for your provisioned instance."
      />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-6 p-4">
          <VersionField label="Auth version" value={versions.authVersion} />
          <VersionField label="API version" value={versions.apiVersion} />
          <VersionField label="Database version" value={versions.dbVersion} />

          <div className="flex w-full flex-col items-start gap-1 rounded-lg border border-black/8 bg-black/[0.01] p-4">
            {upgradeAvailable ? (
              <>
                <p className="text-[13px] font-semibold text-[#030303]">
                  Your project can be upgraded to the latest database version
                </p>
                <p className="text-[13px] font-medium text-[#464646]">
                  The latest database version ({latestDbVersion}) is available
                  for your project.
                </p>
                <UpgradeDatabaseButton
                  projectId={projectId}
                  disabled={!canUpgrade}
                />
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-[#030303]">
                  Your project is up to date
                </p>
                <p className="text-[13px] font-medium text-[#464646]">
                  Running the latest database version ({latestDbVersion}).
                </p>
              </>
            )}
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
