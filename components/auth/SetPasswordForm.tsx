"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/actions/security";
import { Field, SubmitButton } from "./AuthPrimitives";
import { useActionToast } from "@/components/layout/useActionToast";
import type { ActionState } from "@/lib/actions/profile";
import { DEFAULT_SIGNED_IN_PATH } from "@/auth.config";

const initialState: ActionState = {};

export function SetPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );
  // ToastProvider lives in the root layout, so this survives the redirect
  // below and lands on /dashboard.
  useActionToast(state, "Password set.");

  // requireUser() re-checks hasPassword from the database on every request,
  // so once the write above succeeds this redirect just needs to happen —
  // there is no flag to clear on the way out.
  useEffect(() => {
    if (state.ok) router.push(DEFAULT_SIGNED_IN_PATH);
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">

      <Field
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.newPassword}
      />

      <SubmitButton pending={pending}>
        {pending ? "Saving..." : "Set password"}
      </SubmitButton>
    </form>
  );
}
