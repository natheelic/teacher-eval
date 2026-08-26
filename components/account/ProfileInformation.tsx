"use client";

import { useActionState, useState, useTransition } from "react";
import { updateProfile, type ActionState } from "@/lib/actions/profile";
import { resendVerificationEmail } from "@/lib/actions/email-verification";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";

export type ProfileInformationProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    email: string;
    emailVerified: boolean;
  };
  canResendVerification: boolean;
};

const initialState: ActionState = {};

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
      <div className="flex flex-1 flex-col items-start">
        <label className="text-[13px] font-medium text-[#030303]">{label}</label>
        {description && (
          <p className="text-[13px] font-medium text-[#696969]">{description}</p>
        )}
      </div>
      <div className="flex w-full shrink-0 flex-col gap-1 sm:w-[262px]">
        {children}
      </div>
    </div>
  );
}

const inputClass =
  "h-[34px] w-full rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30";

export function ProfileInformation({
  user,
  canResendVerification,
}: ProfileInformationProps) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );
  const [verifyState, setVerifyState] = useState<ActionState>({});
  const [verifyPending, startVerifying] = useTransition();

  function resendVerification() {
    startVerifying(async () => {
      setVerifyState(await resendVerificationEmail());
    });
  }

  return (
    <form action={formAction} className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="Profile information" description="" />
      <SettingsCard>
        <Row label="First name">
          <input
            name="firstName"
            defaultValue={user.firstName ?? ""}
            placeholder="First name"
            className={inputClass}
          />
          {state.fieldErrors?.firstName && (
            <FieldError message={state.fieldErrors.firstName} />
          )}
        </Row>

        <Row label="Last name">
          <input
            name="lastName"
            defaultValue={user.lastName ?? ""}
            placeholder="Last name"
            className={inputClass}
          />
          {state.fieldErrors?.lastName && (
            <FieldError message={state.fieldErrors.lastName} />
          )}
        </Row>

        <Row
          label="Primary email"
          description="Used for account notifications"
        >
          {/* Read-only for now: changing the primary email needs a
              verification flow, and multiple emails are not modelled yet. */}
          <input
            value={user.email}
            readOnly
            disabled
            aria-label="Primary email"
            className={`${inputClass} cursor-not-allowed text-[#696969] opacity-70`}
          />
          {user.emailVerified ? (
            <span className="text-xs font-medium text-[#16b674]">
              Verified
            </span>
          ) : verifyState.ok ? (
            <span className="text-xs font-medium text-[#16b674]">
              Verification email sent
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#dc7b18]">
                Not verified
              </span>
              {canResendVerification && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={verifyPending}
                  className="text-xs font-medium text-[#030303] underline hover:no-underline disabled:opacity-50"
                >
                  {verifyPending ? "Sending..." : "Resend"}
                </button>
              )}
              {verifyState.error && (
                <span className="text-xs font-medium text-[#ab413e]">
                  {verifyState.error}
                </span>
              )}
            </div>
          )}
        </Row>

        <Row label="Username" description="Display name used across dashboard">
          <input
            name="username"
            defaultValue={user.username ?? ""}
            placeholder="username"
            className={inputClass}
          />
          {state.fieldErrors?.username && (
            <FieldError message={state.fieldErrors.username} />
          )}
        </Row>

        <div className="flex w-full items-center justify-end gap-3 p-4">
          {state.ok && (
            <span className="text-xs font-medium text-[#16b674]">Saved</span>
          )}
          {state.error && (
            <span className="text-xs font-medium text-[#ab413e]">
              {state.error}
            </span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-[#62d79f] disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </SettingsCard>
    </form>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs font-medium text-[#ab413e]">{message}</p>;
}
