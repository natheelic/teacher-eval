import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { SECRET_LABELS, decryptSecret } from "@/lib/secret-box";

/**
 * Resolves the SMTP configuration actually in effect (ROADMAP 7.2).
 *
 * Deliberately separate from lib/queries/settings.ts: getAppSettings() is an
 * unauthenticated read whose result reaches anonymous visitors, so it must
 * never select AppSettings.smtpPassEncrypted. This module selects the SMTP
 * columns and nothing else, and its result never leaves the server.
 *
 * Also deliberately NOT requireAdmin()-gated — password-reset mail is sent on
 * an unauthenticated path, so the send path cannot require a session. For the
 * admin-facing view (which masks the password) see lib/queries/email-settings.ts.
 */

export type EmailConfig = {
  host: string;
  port: number;
  from: string;
  user?: string;
  pass?: string;
};

/** Which of the two config sources won, for the admin panel to display. */
export type EmailConfigSource = "database" | "environment" | "unset";

const SETTINGS_ID = "singleton";

/**
 * Precedence is all-or-nothing on each side: a complete database triple
 * (host + port + from) wins outright, otherwise a complete env triple wins,
 * otherwise email is off.
 *
 * The two are never merged. A database host combined with an env SMTP_FROM is
 * exactly the surprise that sends mail from the wrong address after a
 * half-finished admin edit.
 */
export const resolveEmailConfig = cache(
  async (): Promise<{ config: EmailConfig | null; source: EmailConfigSource }> => {
    const row = await prisma.appSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpFrom: true,
        smtpUser: true,
        smtpPassEncrypted: true,
      },
    });

    if (row?.smtpHost && row.smtpPort && row.smtpFrom) {
      return {
        config: {
          host: row.smtpHost,
          port: row.smtpPort,
          from: row.smtpFrom,
          user: row.smtpUser ?? undefined,
          pass: decryptStoredPassword(row.smtpPassEncrypted),
        },
        source: "database",
      };
    }

    if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM) {
      return {
        config: {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          from: env.SMTP_FROM,
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        source: "environment",
      };
    }

    return { config: null, source: "unset" };
  },
);

/**
 * Fails soft, unlike decryptTwoFactorSecret() which throws by design. A stored
 * password that will not decrypt (AUTH_SECRET changed, row corrupted) must not
 * take down every page that renders a header — it degrades to "no auth", which
 * a real SMTP server rejects with a clear error the admin can act on.
 *
 * lib/queries/email-settings.ts surfaces the condition explicitly so /admin/email
 * can tell the admin to re-enter the password.
 */
function decryptStoredPassword(ciphertext: string | null): string | undefined {
  if (!ciphertext) return undefined;
  try {
    return decryptSecret(ciphertext, SECRET_LABELS.SMTP_PASSWORD);
  } catch {
    console.error(
      "[email-config] Stored SMTP password could not be decrypted — has AUTH_SECRET changed? Re-enter it at /admin/email.",
    );
    return undefined;
  }
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  return (await resolveEmailConfig()).config;
}

/**
 * Replaces the former synchronous `emailEnabled` const from lib/env.ts, which
 * could only see the env vars. Now async because the answer lives in the
 * database; every call site awaits it.
 */
export async function isEmailEnabled(): Promise<boolean> {
  return (await resolveEmailConfig()).config !== null;
}
