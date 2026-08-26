"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/password-reset";
import type { AuthFormState } from "@/lib/actions/auth";
import { Field, FormError, SubmitButton } from "./AuthPrimitives";

const initialState: AuthFormState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {state.error && <FormError message={state.error} />}

      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 10 characters"
        error={state.fieldErrors?.password}
      />

      <SubmitButton pending={pending}>
        {pending ? "Resetting..." : "Reset password"}
      </SubmitButton>
    </form>
  );
}
