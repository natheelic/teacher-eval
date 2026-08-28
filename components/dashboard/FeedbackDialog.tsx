"use client";

import { useActionState, useState } from "react";
import { submitFeedback } from "@/lib/actions/feedback";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/components/layout/useActionToast";

const initialState: ActionState = {};

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitFeedback,
    initialState,
  );
  useActionToast(state, "Thanks — we got your feedback.");

  // Closing on a new successful result, rather than branching the dialog body
  // on `state.ok`: that branch stayed true until the next dispatch, so
  // reopening Feedback after sending once showed the thank-you screen with no
  // way back to the form.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-foreground-secondary hover:bg-hover sm:flex"
      >
        Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send feedback"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-lg">
              <form action={formAction} className="flex flex-col gap-4">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Send feedback
                </h2>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-foreground">
                    What&apos;s on your mind?
                  </span>
                  <textarea
                    name="message"
                    rows={4}
                    className="w-full rounded-md border border-border-strong bg-hover px-3 py-2 text-[13px] font-medium text-foreground outline-none focus:border-border-emphasis"
                  />
                </label>
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
                    className="flex h-[26px] items-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-xs font-medium text-[#030303] hover:bg-[#62d79f] disabled:opacity-50"
                  >
                    {pending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </>
  );
}
