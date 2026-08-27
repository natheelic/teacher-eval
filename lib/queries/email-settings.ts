import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-session";
import { resolveEmailConfig, type EmailConfigSource } from "@/lib/email-config";
import { SECRET_LABELS, decryptSecret } from "@/lib/secret-box";

/**
 * The admin-facing view of SMTP settings (ROADMAP 7.2) — deliberately distinct
 * from lib/email-config.ts's resolveEmailConfig(), which returns the live
 * password so mail can actually be sent.
 *
 * This never returns the password or its ciphertext, only whether one exists
 * and whether it still decrypts. The form renders "a password is saved"
 * instead of the value, which is also what lets an empty password field mean
 * "leave unchanged" rather than "delete it".
 */
export type SmtpAdminView = {
  host: string | null;
  port: number | null;
  from: string | null;
  user: string | null;
  /** A password is stored — never the value itself. */
  hasPassword: boolean;
  /** False when a stored password fails to decrypt (AUTH_SECRET changed). */
  passwordDecryptable: boolean;
  /** Which config is actually in effect, database or environment. */
  source: EmailConfigSource;
};

const SETTINGS_ID = "singleton";

export const getSmtpSettingsForAdmin = cache(async (): Promise<SmtpAdminView> => {
  await requireAdmin();

  const [row, resolved] = await Promise.all([
    prisma.appSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpFrom: true,
        smtpUser: true,
        smtpPassEncrypted: true,
      },
    }),
    resolveEmailConfig(),
  ]);

  let passwordDecryptable = true;
  if (row?.smtpPassEncrypted) {
    try {
      decryptSecret(row.smtpPassEncrypted, SECRET_LABELS.SMTP_PASSWORD);
    } catch {
      passwordDecryptable = false;
    }
  }

  return {
    host: row?.smtpHost ?? null,
    port: row?.smtpPort ?? null,
    from: row?.smtpFrom ?? null,
    user: row?.smtpUser ?? null,
    hasPassword: Boolean(row?.smtpPassEncrypted),
    passwordDecryptable,
    source: resolved.source,
  };
});
