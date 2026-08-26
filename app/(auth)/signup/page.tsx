import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import {
  AuthCard,
  AuthHeading,
  OrDivider,
} from "@/components/auth/AuthPrimitives";
import { googleEnabled } from "@/lib/env";
import { DEFAULT_SIGNED_IN_PATH } from "@/auth.config";

export const metadata: Metadata = { title: "Create an account" };

function safePath(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.startsWith("/") && !raw.startsWith("//")
    ? raw
    : DEFAULT_SIGNED_IN_PATH;
}

export default async function SignUpPage({
  searchParams,
}: PageProps<"/signup">) {
  const params = await searchParams;
  const callbackUrl = safePath(params.callbackUrl);

  return (
    <AuthCard>
      <AuthHeading
        title="Create an account"
        description="Create an account to get started."
      />

      <SignUpForm callbackUrl={callbackUrl} />

      {googleEnabled && (
        <>
          <OrDivider />
          <GoogleButton callbackUrl={callbackUrl} />
        </>
      )}
    </AuthCard>
  );
}
