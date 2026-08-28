"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/password-reset";
import type { ActionState } from "@/lib/actions/profile";
import { Field, SubmitButton } from "./AuthPrimitives";
import { useActionToast } from "@/components/layout/useActionToast";

const initialState: ActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  // Failures only. Success is a whole screen rather than a message: it tells
  // the user to go and check their inbox, which is the next step in the flow
  // and must not vanish on a timer.
  useActionToast(state);

  if (state.ok) {
    return (
      <div className="flex w-full flex-col gap-4">
        <p className="text-[13px] font-medium text-foreground-secondary">
          If an account exists for that email, we&apos;ve sent a link to
          reset the password. The link expires in 1 hour.
        </p>
        <p className="text-center text-[13px] font-medium text-foreground-muted">
          <Link href="/signin" className="text-foreground hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={state.fieldErrors?.email}
      />

      <SubmitButton pending={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </SubmitButton>

      <p className="text-center text-[13px] font-medium text-foreground-muted">
        <Link href="/signin" className="text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
