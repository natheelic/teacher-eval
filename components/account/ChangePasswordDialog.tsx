"use client";

import { useActionState, useState } from "react";
import { changePassword } from "@/lib/actions/security";
import type { ActionState } from "@/lib/actions/profile";

const initialState: ActionState = {};

const inputClass =
  "h-[34px] w-full rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30";

export function ChangePasswordDialog({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  // Derived rather than closed from an effect: a successful save closes it.
  const showDialog = open && !state.ok;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4"
      >
        {hasPassword ? "Change password" : "Set a password"}
      </button>

      {showDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={hasPassword ? "Change password" : "Set a password"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            action={formAction}
            className="flex w-full max-w-[400px] flex-col gap-4 rounded-lg border border-black/8 bg-white p-6 shadow-lg"
          >
            <h2 className="font-display text-lg font-semibold text-[#030303]">
              {hasPassword ? "Change password" : "Set a password"}
            </h2>
            <p className="text-[13px] font-medium text-[#464646]">
              This signs out your other devices.
            </p>

            {hasPassword && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[#030303]">
                  Current password
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

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#030303]">
                New password
              </span>
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                className={inputClass}
              />
              {state.fieldErrors?.newPassword && (
                <span className="text-xs font-medium text-[#ab413e]">
                  {state.fieldErrors.newPassword}
                </span>
              )}
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-[26px] items-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 text-xs font-medium text-[#030303] hover:bg-black/4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex h-[26px] items-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-xs font-medium text-[#030303] hover:bg-[#62d79f] disabled:opacity-50"
              >
                {pending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
