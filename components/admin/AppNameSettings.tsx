"use client";

import { useActionState } from "react";
import {
  SectionHeading,
  SettingsCard,
  SettingsRow,
} from "../account/SettingsPrimitives";
import {
  updateAppName,
  type SettingsActionState,
} from "@/lib/actions/settings";

const initialState: SettingsActionState = {};

export function AppNameSettings({ currentName }: { currentName: string }) {
  const [state, formAction, submitting] = useActionState(
    updateAppName,
    initialState,
  );

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="App name"
        description="The product name shown in headers, page titles and outgoing email."
      />
      <SettingsCard>
        <SettingsRow
          label="Name"
          description="Appears across the app and in every email it sends."
          bordered={false}
          control={
            // Remounted on the resolved name so the input picks up the saved
            // value after a successful save, rather than holding stale text.
            <form key={currentName} action={formAction} className="flex flex-col items-end gap-2">
              <input
                name="appName"
                defaultValue={currentName}
                maxLength={60}
                required
                aria-label="App name"
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground outline-none focus:border-border-strong"
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-hover disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
              {state.error && (
                <p className="text-[13px] font-medium text-danger">{state.error}</p>
              )}
            </form>
          }
        />
      </SettingsCard>
    </div>
  );
}
