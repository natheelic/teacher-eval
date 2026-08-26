import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { AuthCard, AuthHeading } from "@/components/auth/AuthPrimitives";
import { getCurrentUser } from "@/lib/auth/require-session";

export const metadata: Metadata = { title: "Set a password" };

/**
 * Reached only via the requireUser() redirect for an account with no
 * password (currently only possible via Google sign-in). Calls
 * getCurrentUser() directly rather than requireUser() — the gated version —
 * because this *is* the page that gate sends people to; routing it through
 * requireUser() again would redirect it right back to itself.
 */
export default async function SetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.hasPassword) redirect("/dashboard");

  return (
    <AuthCard>
      <AuthHeading
        title="Set a password"
        description="Your account signed up with Google and has no password yet. Set one to continue — it's your backup way in if Google sign-in is ever unavailable."
      />
      <SetPasswordForm />
    </AuthCard>
  );
}
