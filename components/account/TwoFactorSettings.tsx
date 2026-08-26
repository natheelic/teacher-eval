"use client";

import { useActionState, useState, useTransition } from "react";
import { SectionHeading, SettingsCard, SettingsRow } from "./SettingsPrimitives";
import {
  confirmTwoFactorEnrollment,
  disableTwoFactor,
  startTwoFactorEnrollment,
} from "@/lib/actions/twoFactor";
import type { ActionState } from "@/lib/actions/profile";
import type { TwoFactorSetupState } from "@/lib/actions/twoFactor";

const inputClass =
  "h-[34px] w-full shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30 sm:w-[262px]";

const setupInitialState: TwoFactorSetupState = {};
const disableInitialState: ActionState = {};

function EnrollmentForm({
  pending: setup,
  onCancel,
}: {
  pending: { qrDataUrl: string; manualKey: string; token: string };
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    confirmTwoFactorEnrollment,
    setupInitialState,
  );

  if (state.ok) {
    return (
      <p className="p-4 text-[13px] font-medium text-[#097c4f]">
        Two-factor authentication is on.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col items-start gap-4 p-4">
      <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:gap-6">
        <img
          src={setup.qrDataUrl}
          alt="Scan with your authenticator app"
          width={160}
          height={160}
          className="rounded-md border border-black/8"
        />
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[13px] font-medium text-[#030303]">
            Scan this QR code with an authenticator app (Google Authenticator,
            1Password, Authy...), or enter the key manually:
          </p>
          <code className="w-fit rounded border border-black/8 bg-black/[0.03] px-2 py-1 text-[13px] tracking-wider text-[#030303]">
            {setup.manualKey}
          </code>
        </div>
      </div>

      <input type="hidden" name="token" value={setup.token} />

      <label className="flex w-full flex-col items-start gap-1.5">
        <span className="text-[13px] font-medium text-[#030303]">
          Enter the 6-digit code from the app
        </span>
        <input
          name="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="123456"
          className={inputClass}
        />
        {state.fieldErrors?.code && (
          <span className="text-xs font-medium text-[#ab413e]">
            {state.fieldErrors.code}
          </span>
        )}
        {state.error && (
          <span className="text-xs font-medium text-[#ab413e]">{state.error}</span>
        )}
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-[#62d79f] disabled:opacity-50"
        >
          {pending ? "Confirming..." : "Confirm and enable"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function DisableForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(
    disableTwoFactor,
    disableInitialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col items-start gap-3 p-4">
      {hasPassword && (
        <label className="flex w-full flex-col items-start gap-1.5">
          <span className="text-[13px] font-medium text-[#030303]">
            Confirm your password
          </span>
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className={inputClass}
          />
          {state.fieldErrors?.currentPassword && (
            <span className="text-xs font-medium text-[#ab413e]">
              {state.fieldErrors.currentPassword}
            </span>
          )}
        </label>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-[26px] items-center justify-center rounded-md border border-[#ab413e]/40 bg-[#ab413e]/10 px-2.5 py-1 text-xs font-medium text-[#ab413e] hover:bg-[#ab413e]/15 disabled:opacity-50"
      >
        {pending ? "Disabling..." : "Disable two-factor authentication"}
      </button>
    </form>
  );
}

export function TwoFactorSettings({
  enabled,
  hasPassword,
}: {
  enabled: boolean;
  hasPassword: boolean;
}) {
  const [pendingSetup, startTransition] = useTransition();
  const [setup, setSetup] = useState<TwoFactorSetupState["pending"] | null>(null);
  const [disabling, setDisabling] = useState(false);

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="Two-factor authentication" description="" />
      <SettingsCard>
        {setup ? (
          <EnrollmentForm pending={setup} onCancel={() => setSetup(null)} />
        ) : enabled ? (
          disabling ? (
            <DisableForm hasPassword={hasPassword} />
          ) : (
            <SettingsRow
              bordered={false}
              label="Two-factor authentication is on"
              description="A code from your authenticator app is required to sign in."
              control={
                <button
                  type="button"
                  onClick={() => setDisabling(true)}
                  className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4"
                >
                  Disable
                </button>
              }
            />
          )
        ) : (
          <SettingsRow
            bordered={false}
            label="Add a second factor to sign in"
            description="Use an authenticator app to require a 6-digit code alongside your password."
            control={
              <button
                type="button"
                disabled={pendingSetup}
                onClick={() =>
                  startTransition(async () => {
                    const result = await startTwoFactorEnrollment();
                    if (result.pending) setSetup(result.pending);
                  })
                }
                className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4 disabled:opacity-50"
              >
                {pendingSetup ? "Starting..." : "Set up two-factor authentication"}
              </button>
            }
          />
        )}
      </SettingsCard>
    </div>
  );
}
