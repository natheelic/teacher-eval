import { createVerificationToken } from "@/lib/auth/verification-tokens";
import { sendEmail, escapeHtml } from "@/lib/email";
import { absoluteUrl } from "@/lib/url";
import { appName } from "@/lib/app-config";

const RESET_EXPIRY_MS = 60 * 60 * 1000;

export async function sendPasswordResetEmail(
  email: string,
  name: string,
): Promise<void> {
  const token = await createVerificationToken(email, RESET_EXPIRY_MS);
  const url = await absoluteUrl(`/reset-password?token=${token}`);

  await sendEmail({
    to: email,
    subject: `Reset your password for ${appName}`,
    text: `Hi ${name},\n\nSomeone requested a password reset for your ${appName} account. If this was you, choose a new password: ${url}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Someone requested a password reset for your ${escapeHtml(appName)} account. If this was you:</p>
      <p><a href="${url}">Choose a new password</a></p>
      <p style="color:#696969;font-size:13px">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
