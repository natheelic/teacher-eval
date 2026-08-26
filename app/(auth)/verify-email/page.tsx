import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthHeading } from "@/components/auth/AuthPrimitives";
import { verifyEmailToken } from "@/lib/auth/email-verification";
import { DEFAULT_SIGNED_IN_PATH } from "@/auth.config";

export const metadata: Metadata = { title: "Verify email" };

/**
 * Verifies on render rather than behind a button click — a single-use link
 * that "just works" is the expected UX for email verification, and
 * requireUser()'s own soft-delete-on-expiry already establishes that a
 * state-changing side effect triggered by navigation, not a form submit, is
 * an accepted pattern in this codebase.
 */
export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? raw[0] : raw;

  const verified = token ? await verifyEmailToken(token) : false;

  return (
    <AuthCard>
      <AuthHeading
        title={verified ? "Email verified" : "Invalid or expired link"}
        description={
          verified
            ? "Your email address is confirmed."
            : "This verification link is invalid or has expired. You can request a new one from your account preferences."
        }
      />
      <p className="text-center text-[13px] font-medium text-[#696969]">
        <Link
          href={DEFAULT_SIGNED_IN_PATH}
          className="text-[#030303] hover:underline"
        >
          Continue to dashboard
        </Link>
      </p>
    </AuthCard>
  );
}
