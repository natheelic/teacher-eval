"use client";

import { useActionState, useState, useTransition } from "react";
import { Trash2, Upload } from "lucide-react";
import {
  SectionHeading,
  SettingsCard,
  SettingsRow,
} from "../account/SettingsPrimitives";
import { AppLogo } from "../dashboard/AppLogo";
import {
  removeLogo,
  updateLogo,
  type LogoActionState,
} from "@/lib/actions/settings";
import { useActionToast } from "@/components/layout/useActionToast";
import { useToast } from "@/components/layout/ToastProvider";

const initialState: LogoActionState = {};

export function LogoSettings({
  currentLogoUrl,
}: {
  currentLogoUrl: string | null;
}) {
  const [state, formAction, submitting] = useActionState(
    updateLogo,
    initialState,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [removing, startRemoveTransition] = useTransition();
  const { toast } = useToast();
  useActionToast(state, "Logo updated.");
  // Bumped whenever a submission actually succeeds, and used as the file
  // input's `key` — remounting is the standard way to reset an uncontrolled
  // file input's displayed filename, rather than an effect reaching into the
  // DOM. Tracking `prevState` lets this run once per genuinely new result
  // (adjusting state during render, not in an effect) instead of on every
  // render where state.ok happens to already be true.
  const [inputKey, setInputKey] = useState(0);
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok) {
      setPreview(null);
      setInputKey((k) => k + 1);
    }
  }

  // Shown immediately on file selection, before the upload completes — the
  // server-side preview only updates once revalidateEverywhere() takes
  // effect on the next render.
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function handleRemove() {
    startRemoveTransition(async () => {
      const result = await removeLogo();
      setPreview(null);
      if (result?.error) toast(result.error, "danger");
      else toast("Logo removed.");
    });
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Logo"
        description="The logo shown across the app, in place of the default mark."
      />

      <SettingsCard>
        <SettingsRow
          label="Logo"
          description="PNG, JPEG, or WebP. Up to 2MB."
          bordered={false}
          control={
            <div className="flex w-full flex-col items-end gap-3">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border bg-hover p-2">
                <AppLogo
                  className="h-full w-full"
                  src={preview ?? currentLogoUrl}
                />
              </div>

              <form
                action={formAction}
                className="flex w-full flex-col items-end gap-2"
              >
                <input
                  key={inputKey}
                  type="file"
                  name="logo"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-xs font-medium text-foreground-muted file:mr-2 file:rounded-md file:border file:border-border-strong file:bg-background file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-hover"
                />
                <div className="flex items-center gap-2">
                  {currentLogoUrl && (
                    <button
                      type="button"
                      disabled={removing || submitting}
                      onClick={handleRemove}
                      className="flex h-[26px] items-center gap-1.5 rounded-md border border-danger/30 bg-danger-soft px-2.5 text-xs font-medium text-foreground hover:brightness-95 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || removing}
                    className="flex h-[26px] items-center gap-1.5 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-xs font-medium text-[#030303] hover:brightness-95 disabled:opacity-50"
                  >
                    <Upload className="size-3.5" />
                    {submitting ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </div>
          }
        />
      </SettingsCard>
    </div>
  );
}
