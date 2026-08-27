"use client";

import { useActionState, useTransition } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import {
  SectionHeading,
  SettingsCard,
  SettingsRow,
} from "../account/SettingsPrimitives";
import {
  deactivateAnnouncement,
  saveAnnouncement,
  type AnnouncementActionState,
} from "@/lib/actions/announcements";
import type { AnnouncementView } from "@/lib/queries/announcements";

const initialState: AnnouncementActionState = {};

export function AnnouncementSettings({
  current,
}: {
  current: AnnouncementView | null;
}) {
  const [state, formAction, submitting] = useActionState(
    saveAnnouncement,
    initialState,
  );
  const [deactivating, startDeactivateTransition] = useTransition();

  function handleDeactivate() {
    startDeactivateTransition(async () => {
      await deactivateAnnouncement();
    });
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Announcement"
        description="A message shown to every signed-in user until they dismiss it."
      />

      <SettingsCard>
        <SettingsRow
          label={current ? "Current announcement" : "No announcement"}
          description={
            current
              ? "Editing replaces the message everyone currently sees."
              : "Publish a message to show it to every signed-in user."
          }
          bordered={false}
          control={
            // Keyed by the current announcement's id so the textarea remounts
            // with a fresh defaultValue whenever `current` changes identity
            // (published, then deactivated) — same trick LogoSettings uses
            // to reset its file input, rather than a controlled value synced
            // via effect.
            <form
              key={current?.id ?? "none"}
              action={formAction}
              className="flex w-full flex-col items-end gap-2"
            >
              <textarea
                name="message"
                rows={3}
                defaultValue={current?.message ?? ""}
                placeholder="We're updating our Terms of Service..."
                maxLength={500}
                className="w-full rounded-md border border-border-strong bg-hover px-3 py-2 text-[13px] font-medium text-foreground outline-none focus:border-border-emphasis"
              />
              {state.error && (
                <span className="text-xs font-medium text-danger">
                  {state.error}
                </span>
              )}
              <div className="flex items-center gap-2">
                {current && (
                  <button
                    type="button"
                    disabled={deactivating || submitting}
                    onClick={handleDeactivate}
                    className="flex h-[26px] items-center gap-1.5 rounded-md border border-danger/30 bg-danger-soft px-2.5 text-xs font-medium text-foreground hover:brightness-95 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                    Deactivate
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || deactivating}
                  className="flex h-[26px] items-center gap-1.5 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-xs font-medium text-[#030303] hover:brightness-95 disabled:opacity-50"
                >
                  <Megaphone className="size-3.5" />
                  {submitting
                    ? "Saving..."
                    : current
                      ? "Save changes"
                      : "Publish"}
                </button>
              </div>
            </form>
          }
        />
      </SettingsCard>
    </div>
  );
}
