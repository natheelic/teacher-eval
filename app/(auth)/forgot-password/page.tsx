import type { Metadata } from "next";
import { AuthCard, AuthHeading } from "@/components/auth/AuthPrimitives";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <AuthHeading
        title="Forgot your password?"
        description="Enter your email and we'll send you a link to reset it."
      />
      <ForgotPasswordForm />
    </AuthCard>
  );
}
