import { SectionHeading, SettingsCard, SettingsRow } from "./SettingsPrimitives";
import { Switch } from "./Switch";

export function DashboardSettings() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Dashboard"
        description="Customize how the dashboard works on this browser and device."
      />
      <SettingsCard>
        <SettingsRow
          label="Edit entities in code"
          description="Edit records and fields directly instead of the guided UI."
          control={<Switch />}
        />
        <SettingsRow
          bordered={false}
          label="Queue table operations"
          description="Review and batch table edits before saving them."
          control={<Switch />}
        />
      </SettingsCard>
    </div>
  );
}
