"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthFormState } from "@/lib/actions/auth";
import { Field, SubmitButton } from "./AuthPrimitives";
import { useActionToast } from "@/components/layout/useActionToast";

const initialState: AuthFormState = {};

export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialState,
  );
  // Only failures reach here: a successful sign-up signs the user in and
  // redirects, so there is no success result to announce.
  useActionToast(state);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />


      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <Field
          label="First name"
          name="firstName"
          autoComplete="given-name"
          placeholder="First name"
          error={state.fieldErrors?.firstName}
        />
        <Field
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          placeholder="Last name"
          required={false}
          error={state.fieldErrors?.lastName}
        />
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 10 characters"
        error={state.fieldErrors?.password}
      />

      <SubmitButton pending={pending}>
        {pending ? "Creating account..." : "Create account"}
      </SubmitButton>

      <p className="text-center text-[13px] font-medium text-foreground-muted">
        Already have an account?{" "}
        <Link href="/signin" className="text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
