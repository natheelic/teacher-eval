"use client";

import { useActionState } from "react";
import { acceptInvitation } from "@/lib/actions/invitations";
import type { AuthFormState } from "@/lib/actions/auth";
import { Field, FormError, SubmitButton } from "./AuthPrimitives";

const initialState: AuthFormState = {};

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    acceptInvitation,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {state.error && <FormError message={state.error} />}

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 10 characters"
        error={state.fieldErrors?.password}
      />

      <SubmitButton pending={pending}>
        {pending ? "Activating..." : "Activate account"}
      </SubmitButton>
    </form>
  );
}
