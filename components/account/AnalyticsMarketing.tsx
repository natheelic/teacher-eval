import { SectionHeading, SettingsCard, SettingsRow } from "./SettingsPrimitives";
import { Switch } from "./Switch";

export function AnalyticsMarketing() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Analytics and Marketing"
        description="Control whether telemetry and marketing data is sent from Supabase services."
      />
      <SettingsCard>
        <SettingsRow
          bordered={false}
          label="Send telemetry data from Supabase services"
          description="By opting in to sharing telemetry data, Supabase can analyze usage patterns to enhance user experience and use it for marketing and advertising purposes"
          control={<Switch defaultChecked />}
        />
      </SettingsCard>
    </div>
  );
}
