import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthHeading } from "@/components/auth/AuthPrimitives";
import { AcceptInvitationForm } from "@/components/auth/AcceptInvitationForm";

export const metadata: Metadata = { title: "Accept invitation" };

export default async function AcceptInvitationPage({
  searchParams,
}: PageProps<"/invite/accept">) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? raw[0] : raw;

  if (!token) {
    return (
      <AuthCard>
        <AuthHeading
          title="Invalid invitation link"
          description="This link is missing its token. Check the URL, or ask whoever invited you to resend it."
        />
        <p className="text-center text-[13px] font-medium text-foreground-muted">
          <Link href="/signin" className="text-foreground hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeading
        title="Accept your invitation"
        description="Set a password to activate your account."
      />
      <AcceptInvitationForm token={token} />
    </AuthCard>
  );
}
