"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { Laptop, Smartphone, Tablet, X } from "lucide-react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";
import { RelativeTime } from "./RelativeTime";
import { TwoFactorSettings } from "./TwoFactorSettings";
import {
  changePassword,
  revokeAllOtherSessions,
  revokeDeviceSession,
} from "@/lib/actions/security";
import type { ActionState } from "@/lib/actions/profile";
import type { DeviceSessionView } from "@/lib/queries/account";

export type SecuritySettingsProps = {
  /** False for OAuth-only accounts — they set a password rather than change one. */
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  sessions: DeviceSessionView[];
};

// Device type is a discriminator in the DB; the icon is chosen here.
const DEVICE_ICONS = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
} as const;

const inputClass =
  "h-[34px] w-full shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30 sm:w-[262px]";

const initialState: ActionState = {};

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Password"
        description={
          hasPassword
            ? "Changing your password signs out your other devices."
            : "You signed up with a provider. Set a password to also sign in with email."
        }
      />
      <SettingsCard>
        {hasPassword && (
          <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
            <div className="flex flex-1 flex-col items-start">
              <label
                htmlFor="currentPassword"
                className="text-[13px] font-medium text-[#030303]"
              >
                Current password
              </label>
              {state.fieldErrors?.currentPassword && (
                <p className="text-xs font-medium text-[#ab413e]">
                  {state.fieldErrors.currentPassword}
                </p>
              )}
            </div>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:gap-6">
          <div className="flex flex-1 flex-col items-start">
            <label
              htmlFor="newPassword"
              className="text-[13px] font-medium text-[#030303]"
            >
              New password
            </label>
            {state.fieldErrors?.newPassword && (
              <p className="text-xs font-medium text-[#ab413e]">
                {state.fieldErrors.newPassword}
              </p>
            )}
          </div>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="At least 10 characters"
            className={inputClass}
          />
        </div>

        <div className="flex w-full items-center justify-end gap-3 p-4">
          {state.ok && (
            <span className="text-xs font-medium text-[#16b674]">Updated</span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-[#62d79f] disabled:opacity-50"
          >
            {pending ? "Updating..." : hasPassword ? "Update password" : "Set password"}
          </button>
        </div>
      </SettingsCard>
    </form>
  );
}

function ActiveSessionsSection({ sessions }: { sessions: DeviceSessionView[] }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, removeOptimistic] = useOptimistic(
    sessions,
    (state, id: string | "others") =>
      id === "others"
        ? state.filter((s) => s.isCurrent)
        : state.filter((s) => s.id !== id),
  );

  const hasOthers = optimistic.some((s) => !s.isCurrent);

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full max-w-[688px] flex-wrap items-end justify-between gap-3">
        <SectionHeading
          title="Active sessions"
          description="Devices currently signed in to your account."
        />
        {hasOthers && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                removeOptimistic("others");
                await revokeAllOtherSessions();
              })
            }
            className="flex h-[26px] shrink-0 items-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 text-xs font-medium text-[#030303] hover:bg-black/4 disabled:opacity-50"
          >
            Sign out others
          </button>
        )}
      </div>
      <SettingsCard>
        {optimistic.length === 0 && (
          <p className="p-4 text-[13px] font-medium text-[#696969]">
            No active sessions.
          </p>
        )}
        {optimistic.map((session, i) => {
          const Icon = DEVICE_ICONS[session.deviceType];
          return (
            <div
              key={session.id}
              className={`flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                i < optimistic.length - 1 ? "border-b border-black/8" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-black/4 text-[#464646]">
                  <Icon className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col items-start">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-medium text-[#030303]">
                      {session.deviceLabel}
                    </p>
                    {session.isCurrent && (
                      <span className="flex items-center rounded-full border border-[#16b674] bg-[#3fcf8e]/10 px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-[#097c4f]">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-medium text-[#696969]">
                    {session.location ?? "Unknown location"} ·{" "}
                    <RelativeTime iso={session.lastActiveAt} />
                  </p>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  type="button"
                  disabled={pending}
                  aria-label={`Revoke ${session.deviceLabel}`}
                  onClick={() =>
                    startTransition(async () => {
                      removeOptimistic(session.id);
                      await revokeDeviceSession(session.id);
                    })
                  }
                  className="flex size-7 items-center justify-center rounded-md hover:bg-black/4 disabled:opacity-50"
                >
                  <X className="size-3.5 text-[#464646]" />
                </button>
              )}
            </div>
          );
        })}
      </SettingsCard>
    </div>
  );
}

export function SecuritySettings({
  hasPassword,
  twoFactorEnabled,
  sessions,
}: SecuritySettingsProps) {
  return (
    <div className="flex w-full flex-col gap-16">
      <PasswordSection hasPassword={hasPassword} />
      <TwoFactorSettings enabled={twoFactorEnabled} hasPassword={hasPassword} />
      <ActiveSessionsSection sessions={sessions} />
    </div>
  );
}
