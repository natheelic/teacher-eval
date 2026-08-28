"use client";

import { useActionState } from "react";
import { acceptInvitation } from "@/lib/actions/invitations";
import type { AuthFormState } from "@/lib/actions/auth";
import { Field, SubmitButton } from "./AuthPrimitives";
import { useActionToast } from "@/components/layout/useActionToast";

const initialState: AuthFormState = {};

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    acceptInvitation,
    initialState,
  );
  // Accepting activates the account and signs the invitee in, so failures only.
  useActionToast(state);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="token" value={token} />


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
