import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthHeading } from "@/components/auth/AuthPrimitives";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? raw[0] : raw;

  if (!token) {
    return (
      <AuthCard>
        <AuthHeading
          title="Invalid reset link"
          description="This link is missing its token. Check the URL, or request a new one."
        />
        <p className="text-center text-[13px] font-medium text-[#696969]">
          <Link
            href="/forgot-password"
            className="text-[#030303] hover:underline"
          >
            Request a new link
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeading
        title="Reset your password"
        description="Choose a new password for your account."
      />
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
