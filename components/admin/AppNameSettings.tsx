"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import {
  SectionHeading,
  SettingsBlock,
  SettingsCard,
  SettingsField,
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
        description="Shown in headers, page titles, and every email the app sends."
      />
      <SettingsCard>
        {/* Remounted on the resolved name so the input picks up the saved
            value after a successful save, rather than holding stale text. */}
        <form key={currentName} action={formAction} className="flex w-full flex-col">
          <SettingsBlock bordered={false}>
            <SettingsField label="Name" htmlFor="appName">
              <input
                id="appName"
                name="appName"
                defaultValue={currentName}
                maxLength={60}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-border-strong"
              />
            </SettingsField>

            {state.error && (
              <p className="text-[13px] font-medium text-danger">{state.error}</p>
            )}
            {state.ok && (
              <p className="text-[13px] font-medium text-foreground-secondary">
                Name saved.
              </p>
            )}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-[30px] items-center gap-1.5 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-3 text-xs font-medium text-[#030303] hover:brightness-95 disabled:opacity-50"
              >
                <Check className="size-3.5" />
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </SettingsBlock>
        </form>
      </SettingsCard>
    </div>
  );
}
