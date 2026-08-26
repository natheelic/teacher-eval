"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signInAction, type AuthFormState } from "@/lib/actions/auth";
import { Field, FormError, SubmitButton } from "./AuthPrimitives";

const initialState: AuthFormState = {};

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );
  const showCode = state.needsCode ?? false;

  // Controlled rather than relying on the browser retaining uncontrolled
  // input DOM state across the two submissions this flow needs once 2FA is
  // enabled — a Server Action round trip doesn't guarantee that survives.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        className="-mt-2 self-end text-xs font-medium text-[#696969] hover:text-[#030303] hover:underline"
      >
        Forgot password?
      </Link>
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

      <p className="text-center text-[13px] font-medium text-[#696969]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#030303] hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
