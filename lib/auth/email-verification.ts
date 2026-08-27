import { prisma } from "@/lib/prisma";
import {
  createVerificationToken,
  consumeVerificationToken,
} from "@/lib/auth/verification-tokens";
import { sendEmail, escapeHtml } from "@/lib/email";
import { isEmailEnabled } from "@/lib/email-config";
import { absoluteUrl } from "@/lib/url";
import { appName } from "@/lib/app-config";

const VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Best-effort: unlike invitations, verification never gates anything the
 * account needs to function, so a missing SMTP config (or a transient send
 * failure) silently skips rather than failing the caller — sign-up must
 * stay usable on a fresh install with no email configured yet.
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
): Promise<void> {
  if (!(await isEmailEnabled())) return;

  const token = await createVerificationToken(email, VERIFY_EXPIRY_MS);
  const url = await absoluteUrl(`/verify-email?token=${token}`);

  await sendEmail({
    to: email,
    subject: `Verify your email for ${appName}`,
    text: `Hi ${name},\n\nConfirm this is your email address: ${url}\n\nThis link expires in 24 hours.`,
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p><a href="${url}">Confirm this is your email address</a></p>
      <p style="color:#696969;font-size:13px">This link expires in 24 hours.</p>
    `,
  }).catch(() => {
    // Best effort — sign-up (or a resend click) must not fail over mail delivery.
  });
}

/**
 * Consumes a verification token and stamps emailVerified on the matching
 * account. Returns whether it succeeded, distinguishing "bad/expired token"
 * from "token was fine, but no live account has this email anymore" isn't
 * useful to the caller — both render the same "invalid or expired" message.
 */
export async function verifyEmailToken(plaintext: string): Promise<boolean> {
  const email = await consumeVerificationToken(plaintext);
  if (!email) return false;

  const result = await prisma.user.updateMany({
    where: { email, deletedAt: null },
    data: { emailVerified: new Date() },
  });

  return result.count > 0;
}
