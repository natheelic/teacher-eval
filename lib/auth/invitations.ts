import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/url";
import { appName } from "@/lib/app-config";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Reuses the Auth.js adapter's VerificationToken model rather than a new
 * table — it's part of the schema already (composite `[identifier, token]`
 * PK) and otherwise sits completely unused, since no Email provider is
 * registered. `identifier` is the invitee's email; `token` is stored as a
 * SHA-256 hash (hashToken(), the same function API tokens use), never the
 * raw value that goes out in the email link.
 */
export async function createInvitationToken(email: string): Promise<string> {
  const plaintext = randomBytes(32).toString("base64url");

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashToken(plaintext),
      expires: new Date(Date.now() + INVITE_EXPIRY_MS),
    },
  });

  return plaintext;
}

/**
 * One-time: the matching row is deleted on a successful lookup, so a used or
 * expired link can never be replayed. Returns the invited email, or null for
 * anything that doesn't resolve to a live invitation.
 */
export async function consumeInvitationToken(
  plaintext: string,
): Promise<string | null> {
  const row = await prisma.verificationToken.findFirst({
    where: { token: hashToken(plaintext), expires: { gt: new Date() } },
  });
  if (!row) return null;

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: row.identifier, token: row.token } },
  });

  return row.identifier;
}

export async function sendInvitationEmail(
  email: string,
  inviterName: string,
): Promise<void> {
  const token = await createInvitationToken(email);
  const url = await absoluteUrl(`/invite/accept?token=${token}`);

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
