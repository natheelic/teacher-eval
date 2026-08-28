"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { signInAction, type AuthFormState } from "@/lib/actions/auth";
import { Field, SubmitButton } from "./AuthPrimitives";
import { useActionToast } from "@/components/layout/useActionToast";

const initialState: AuthFormState = {};

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );
  const showCode = state.needsCode ?? false;

  // A `needsCode` result is the prompt for the field that just appeared —
  // "Enter the 6-digit code from your authenticator app." is an instruction,
  // not a failed submission, and it has to stay on screen while the user digs
  // their phone out rather than expiring on a 5s timer. So that one message
  // stays inline (its retry, "Incorrect code. Try again.", stays with it) and
  // everything else — bad credentials, rate limiting — toasts.
  const toastable = useMemo(() => (state.needsCode ? {} : state), [state]);
  useActionToast(toastable);

  // Controlled rather than relying on the browser retaining uncontrolled
  // input DOM state across the two submissions this flow needs once 2FA is
  // enabled — a Server Action round trip doesn't guarantee that survives.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />


      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={setEmail}
        error={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••••"
        value={password}
        onChange={setPassword}
        error={state.fieldErrors?.password}
      />
      <Link
        href="/forgot-password"
        className="-mt-2 self-end text-xs font-medium text-foreground-muted hover:text-foreground hover:underline"
      >
        Forgot password?
      </Link>
      {showCode && state.error && (
        <p
          role="alert"
          className="text-[13px] font-medium text-foreground-secondary"
        >
          {state.error}
        </p>
      )}
      {showCode && (
        <Field
          label="Authentication code"
          name="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="123456"
          error={state.fieldErrors?.code}
        />
      )}

      <SubmitButton pending={pending}>
        {pending ? "Signing in..." : showCode ? "Verify" : "Sign in"}
      </SubmitButton>

      <p className="text-center text-[13px] font-medium text-foreground-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
