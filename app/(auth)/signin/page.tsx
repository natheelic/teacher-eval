import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import {
  AuthCard,
  AuthHeading,
  FormError,
  OrDivider,
} from "@/components/auth/AuthPrimitives";
import { googleEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

/** Auth.js reports provider/callback failures by redirecting here with ?error. */
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Incorrect email or password.",
  OAuthAccountNotLinked:
    "That email already has an account. Sign in with your password first, then link Google from account preferences.",
  OAuthSignin: "Could not start the Google sign-in. Try again.",
  OAuthCallback: "Google sign-in failed. Try again.",
  AccessDenied: "You do not have access to this application.",
  Configuration: "Authentication is misconfigured. Check the server logs.",
};

function safePath(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export default async function SignInPage({
  searchParams,
}: PageProps<"/signin">) {
  // Next 16: searchParams is a Promise.
  const params = await searchParams;
  const callbackUrl = safePath(params.callbackUrl);
  const errorKey = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = errorKey
    ? (ERROR_MESSAGES[errorKey] ?? "Could not sign you in. Try again.")
    : null;

  return (
    <AuthCard>
      <AuthHeading
        title="Sign in"
        description="Welcome back. Enter your details to continue."
      />

      {errorMessage && <FormError message={errorMessage} />}

      <SignInForm callbackUrl={callbackUrl} />

      {googleEnabled && (
        <>
          <OrDivider />
          <GoogleButton callbackUrl={callbackUrl} />
        </>
      )}
    </AuthCard>
  );
}
