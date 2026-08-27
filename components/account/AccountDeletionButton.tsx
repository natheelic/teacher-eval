"use client";

import { useActionState, useState, useTransition } from "react";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
} from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/profile";

const initialState: ActionState = {};

const inputClass =
  "h-[34px] w-full rounded-md border border-border-strong bg-hover px-3 text-[13px] font-medium text-foreground outline-none focus:border-border-emphasis";

export function AccountDeletionButton({
  requested,
  hasPassword,
}: {
  requested: boolean;
  hasPassword: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelPending, startCancel] = useTransition();
  const [state, formAction, pending] = useActionState(
    requestAccountDeletion,
    initialState,
  );

  if (requested) {
    if (cancelConfirming) {
      return (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cancel deletion request"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelConfirming(false);
          }}
        >
          <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Cancel deletion request
            </h2>
            <p className="text-[13px] font-medium text-foreground-secondary">
              Your account will stay scheduled for deletion until you confirm
              this. Cancelling stops the countdown — your data was never
              touched either way.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelConfirming(false)}
                className="flex h-[26px] items-center rounded-md border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground hover:bg-hover"
              >
                Keep deletion scheduled
              </button>
              <button
                type="button"
                disabled={cancelPending}
                onClick={() =>
                  startCancel(async () => {
                    await cancelAccountDeletion();
                    setCancelConfirming(false);
                  })
                }
                className="flex h-[26px] items-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-xs font-medium text-[#030303] hover:bg-[#62d79f] disabled:opacity-50"
              >
                {cancelPending ? "Cancelling..." : "Yes, cancel deletion"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setCancelConfirming(true)}
        className="flex h-[26px] items-center justify-center rounded-md border border-border-strong bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-hover"
      >
        Cancel deletion request
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[26px] items-center justify-center rounded-md border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-medium text-foreground hover:brightness-95"
      >
        Request to delete account
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Request account deletion"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            action={formAction}
            className="flex w-full max-w-[400px] flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-lg"
          >
            <h2 className="font-display text-lg font-semibold text-foreground">
              Request account deletion
            </h2>
            <p className="text-[13px] font-medium text-foreground-secondary">
              This signs you out immediately. Your data is permanently
              deleted after 30 days unless you cancel before then — signing
              back in cancels it automatically too.
            </p>

            {hasPassword && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-foreground">
                  Confirm your password
                </span>
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className={inputClass}
                />
                {state.fieldErrors?.currentPassword && (
                  <span className="text-xs font-medium text-danger">
                    {state.fieldErrors.currentPassword}
                  </span>
                )}
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-[26px] items-center rounded-md border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground hover:bg-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex h-[26px] items-center rounded-md border border-danger/40 bg-danger/10 px-2.5 text-xs font-medium text-danger hover:brightness-95 disabled:opacity-50"
              >
                {pending ? "Requesting..." : "Yes, request deletion"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
