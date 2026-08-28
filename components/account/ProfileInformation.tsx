"use client";

import { useActionState, useState, useTransition } from "react";
import { updateProfile, type ActionState } from "@/lib/actions/profile";
import { resendVerificationEmail } from "@/lib/actions/email-verification";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";
import { useActionToast } from "@/components/layout/useActionToast";

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
    <div className="flex w-full flex-col items-start gap-3 border-b border-border p-4 sm:flex-row sm:gap-6">
      <div className="flex flex-1 flex-col items-start">
        <label className="text-[13px] font-medium text-foreground">{label}</label>
        {description && (
          <p className="text-[13px] font-medium text-foreground-muted">{description}</p>
        )}
      </div>
      <div className="flex w-full shrink-0 flex-col gap-1 sm:w-[262px]">
        {children}
      </div>
    </div>
  );
}

const inputClass =
  "h-[34px] w-full rounded-md border border-border-strong bg-hover px-3 text-[13px] font-medium text-foreground outline-none focus:border-border-emphasis";

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
  useActionToast(state, "Profile saved.");
  useActionToast(verifyState, "Verification email sent.");

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
        </Row>

        <Row label="Last name">
          <input
            name="lastName"
            defaultValue={user.lastName ?? ""}
            placeholder="Last name"
            className={inputClass}
          />
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
            className={`${inputClass} cursor-not-allowed text-foreground-muted opacity-70`}
          />
          {/* Verified / Not verified is account *status*, not action
              feedback, so it stays inline; whether the resend succeeded is
              announced by a toast. */}
          {user.emailVerified ? (
            <span className="text-xs font-medium text-success">
              Verified
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-pending-strong">
                Not verified
              </span>
              {canResendVerification && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={verifyPending}
                  className="text-xs font-medium text-foreground underline hover:no-underline disabled:opacity-50"
                >
                  {verifyPending ? "Sending..." : "Resend"}
                </button>
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
        </Row>

        <div className="flex w-full items-center justify-end gap-3 p-4">
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
