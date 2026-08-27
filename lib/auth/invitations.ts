import {
  createVerificationToken,
  consumeVerificationToken,
} from "@/lib/auth/verification-tokens";
import { sendEmail, escapeHtml } from "@/lib/email";
import { absoluteUrl } from "@/lib/url";
import { getAppSettings } from "@/lib/queries/settings";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function createInvitationToken(email: string): Promise<string> {
  return createVerificationToken(email, INVITE_EXPIRY_MS);
}

export const consumeInvitationToken = consumeVerificationToken;

export async function sendInvitationEmail(
  email: string,
  inviterName: string,
): Promise<void> {
  const token = await createInvitationToken(email);
  const url = await absoluteUrl(`/invite/accept?token=${token}`);
  const { appName } = await getAppSettings();

  await sendEmail({
    to: email,
    subject: `You've been invited to ${appName}`,
    text: `${inviterName} invited you to join ${appName}.\n\nAccept your invitation: ${url}\n\nThis link expires in 7 days.`,
    html: `
      <p>${escapeHtml(inviterName)} invited you to join ${escapeHtml(appName)}.</p>
      <p><a href="${url}">Accept your invitation</a></p>
      <p style="color:#696969;font-size:13px">This link expires in 7 days.</p>
    `,
  });
}
