"use client";

import { useOptimistic, useTransition } from "react";
import { SectionHeading, SettingsCard, SettingsRow } from "./SettingsPrimitives";
import { Switch } from "./Switch";
import {
  updateDashboardSetting,
  type DashboardKey,
} from "@/lib/actions/preferences";

export type DashboardSettingsProps = {
  editEntitiesInCode: boolean;
  queueTableOperations: boolean;
};

export function DashboardSettings(props: DashboardSettingsProps) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    props,
    (state, update: { key: DashboardKey; value: boolean }) => ({
      ...state,
      [update.key]: update.value,
    }),
  );

  function handleToggle(key: DashboardKey, value: boolean) {
    startTransition(async () => {
      setOptimistic({ key, value });
      await updateDashboardSetting(key, value);
    });
  }

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
          control={
            <Switch
              checked={optimistic.editEntitiesInCode}
              onCheckedChange={(next) =>
                handleToggle("editEntitiesInCode", next)
              }
              disabled={pending}
              aria-label="Edit entities in code"
            />
          }
        />
        <SettingsRow
          bordered={false}
          label="Queue table operations"
          description="Review and batch table edits before saving them."
          control={
            <Switch
              checked={optimistic.queueTableOperations}
              onCheckedChange={(next) =>
                handleToggle("queueTableOperations", next)
              }
              disabled={pending}
              aria-label="Queue table operations"
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
