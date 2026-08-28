"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createUser } from "@/lib/actions/users";
import { ROLE_LABELS } from "@/lib/permissions";
import type { ActionState } from "@/lib/actions/profile";
import type { Role } from "@/lib/generated/prisma/enums";
import { useActionToast } from "@/components/layout/useActionToast";

const initialState: ActionState = {};

const inputClass =
  "h-[34px] w-full rounded-md border border-border-strong bg-hover px-3 text-[13px] font-medium text-foreground outline-none focus:border-border-emphasis";

export function CreateUserDialog({
  assignableRoles,
}: {
  assignableRoles: Role[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUser, initialState);
  useActionToast(state, "Invitation sent.");

  // Close on success by reacting to a genuinely new result (adjusting own
  // state during render, the pattern LogoSettings uses) rather than deriving
  // `open && !state.ok`. That derivation could never reopen: `state.ok` stays
  // true until the next dispatch, so after one invite the button was dead for
  // the rest of the page's life — the same shape as the access-token reveal
  // bug in ROADMAP 5.10.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok) setOpen(false);
  }

  // A manager with nothing they may assign cannot create users at all.
  if (assignableRoles.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95"
      >
        <Plus className="size-3.5" />
        Invite user
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Invite user"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            action={formAction}
            className="flex w-full max-w-[420px] flex-col gap-4 rounded-lg border border-border bg-surface p-6 text-left shadow-lg"
          >
            <h2 className="font-display text-lg font-semibold text-foreground">
              Invite user
            </h2>
            <p className="text-[13px] font-medium text-foreground-muted">
              They&apos;ll receive an email with a link to set their own
              password and activate the account.
            </p>

            <div className="flex gap-3">
              <Field
                label="First name"
                name="firstName"
                autoFocus
              />
              <Field
                label="Last name"
                name="lastName"
              />
            </div>

            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="off"
              error={state.fieldErrors?.email}
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-foreground">
                Role
              </span>
              <select
                name="role"
                defaultValue={
                  assignableRoles.includes("MEMBER")
                    ? "MEMBER"
                    : assignableRoles[0]
                }
                className={inputClass}
              >
                {assignableRoles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-end gap-2">
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
                className="flex h-[26px] items-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-xs font-medium text-[#030303] hover:brightness-95 disabled:opacity-50"
              >
                {pending ? "Sending..." : "Send invite"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  autoFocus,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  error?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={inputClass}
      />
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}
