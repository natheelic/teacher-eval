import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import {
  AuthCard,
  AuthHeading,
  OrDivider,
} from "@/components/auth/AuthPrimitives";
import { googleEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Create an account" };

function safePath(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
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
        description="Signing up creates your organization and a first project."
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
