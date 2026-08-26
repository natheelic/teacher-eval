"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthFormState } from "@/lib/actions/auth";
import { Field, FormError, SubmitButton } from "./AuthPrimitives";

const initialState: AuthFormState = {};

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state.error && <FormError message={state.error} />}

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
        autoComplete="current-password"
        placeholder="••••••••••"
        error={state.fieldErrors?.password}
      />

      <SubmitButton pending={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </SubmitButton>

      <p className="text-center text-[13px] font-medium text-[#696969]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#030303] hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
