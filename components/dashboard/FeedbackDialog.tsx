"use client";

import { useActionState, useState } from "react";
import { submitFeedback } from "@/lib/actions/feedback";
import type { ActionState } from "@/lib/actions/profile";

const initialState: ActionState = {};

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitFeedback,
    initialState,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-[#464646] hover:bg-black/4 sm:flex"
      >
        Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send feedback"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-lg border border-black/8 bg-white p-6 shadow-lg">
            {state.ok ? (
              <>
                <h2 className="font-display text-lg font-semibold text-[#030303]">
                  Thanks!
                </h2>
                <p className="text-[13px] font-medium text-[#464646]">
                  We got your feedback.
                </p>
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-[26px] items-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 text-xs font-medium text-[#030303] hover:bg-black/4"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <form action={formAction} className="flex flex-col gap-4">
                <h2 className="font-display text-lg font-semibold text-[#030303]">
                  Send feedback
                </h2>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[#030303]">
                    What&apos;s on your mind?
                  </span>
                  <textarea
                    name="message"
                    rows={4}
                    className="w-full rounded-md border border-black/15 bg-black/[0.01] px-3 py-2 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30"
                  />
                  {state.fieldErrors?.message && (
                    <span className="text-xs font-medium text-[#ab413e]">
                      {state.fieldErrors.message}
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
                    {pending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
