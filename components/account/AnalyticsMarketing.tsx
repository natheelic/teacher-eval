"use client";

import { useOptimistic, useTransition } from "react";
import { SectionHeading, SettingsCard, SettingsRow } from "./SettingsPrimitives";
import { Switch } from "./Switch";
import { updateTelemetry } from "@/lib/actions/preferences";
import { appName } from "@/lib/env";

export function AnalyticsMarketing({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    enabled,
    (_state, next: boolean) => next,
  );

  function handleToggle(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      await updateTelemetry(next);
    });
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Analytics and Marketing"
        description={`Control whether telemetry and marketing data is sent from ${appName} services.`}
      />
      <SettingsCard>
        <SettingsRow
          bordered={false}
          label={`Send telemetry data from ${appName} services`}
          description={`By opting in to sharing telemetry data, ${appName} can analyze usage patterns to enhance user experience and use it for marketing and advertising purposes`}
          control={
            <Switch
              checked={optimistic}
              onCheckedChange={handleToggle}
              disabled={pending}
              aria-label="Send telemetry data"
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
