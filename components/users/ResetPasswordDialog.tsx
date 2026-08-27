"use client";

import { useActionState } from "react";
import { resetUserPassword } from "@/lib/actions/users";
import type { ActionState } from "@/lib/actions/profile";

const initialState: ActionState = {};

export function ResetPasswordDialog({
  userId,
  label,
  onClose,
}: {
  userId: string;
  label: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    resetUserPassword,
    initialState,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reset password for ${label}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        action={formAction}
        className="flex w-full max-w-[400px] flex-col gap-4 rounded-lg border border-border bg-surface p-6 text-left shadow-lg"
      >
        <input type="hidden" name="userId" value={userId} />
        <h2 className="font-display text-lg font-semibold text-foreground">
          Reset password
        </h2>

        {/* Explicit success state rather than auto-dismissing: the reset also
            signed the user out everywhere, which is worth confirming. */}
        {state.ok ? (
          <>
            <p className="text-[13px] font-medium text-foreground-secondary">
              Password reset for {label}. Their existing sessions were signed
              out.
            </p>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex h-[26px] items-center rounded-md border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground hover:bg-hover"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
        <p className="text-[13px] font-medium text-foreground-secondary">
          Sets a new password for {label} and signs them out everywhere.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-foreground">
            New password
          </span>
          <input
            name="password"
            type="password"
            autoFocus
            autoComplete="new-password"
            className="h-[34px] w-full rounded-md border border-border-strong bg-hover px-3 text-[13px] font-medium text-foreground outline-none focus:border-border-emphasis"
          />
          {state.fieldErrors?.password && (
            <span className="text-xs font-medium text-danger">
              {state.fieldErrors.password}
            </span>
          )}
        </label>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[26px] items-center rounded-md border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground hover:bg-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex h-[26px] items-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-xs font-medium text-[#030303] hover:brightness-95 disabled:opacity-50"
          >
            {pending ? "Resetting..." : "Reset password"}
          </button>
        </div>
          </>
        )}
      </form>
    </div>
  );
}
