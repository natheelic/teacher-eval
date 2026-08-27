"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-session";
import { logAudit } from "@/lib/audit";
import { sendEmail, escapeHtml } from "@/lib/email";
import { getAppSettings } from "@/lib/queries/settings";
import { SECRET_LABELS, encryptSecret } from "@/lib/secret-box";
import { getEmailProvider, isEmailProviderId } from "@/lib/email-providers";

export type EmailSettingsActionState = {
  ok?: boolean;
  error?: string;
  /** Set by sendTestEmail so the UI can confirm where the message went. */
  sentTo?: string;
};

const SETTINGS_ID = "singleton";

/**
 * SMTP config is read on exactly one page, unlike the logo and the app name
 * which appear app-wide — so this is a targeted invalidation rather than the
 * root-layout one those use.
 */
function revalidateEmailSettings() {
  revalidatePath("/admin/email");
}

const portSchema = z.coerce
  .number({ error: "Enter a port number" })
  .int("Port must be a whole number")
  .min(1, "Port must be between 1 and 65535")
  .max(65535, "Port must be between 1 and 65535");

const settingsSchema = z.object({
  provider: z
    .string()
    .refine(isEmailProviderId, "Choose an email provider"),
  // Only consulted for the custom provider; every preset supplies its own.
  host: z.string().trim().optional(),
  port: z.string().trim().optional(),
  // NOT z.email() — this is a From header, which may carry a display name,
  // e.g. `Portal <noreply@portal.local>`.
  from: z.string().trim().min(1, "Enter a From address"),
  user: z.string().trim().optional(),
  password: z.string().optional(),
});

export async function saveEmailSettings(
  _prev: EmailSettingsActionState,
  formData: FormData,
): Promise<EmailSettingsActionState> {
  const actor = await requireAdmin();

  const parsed = settingsSchema.safeParse({
    provider: formData.get("provider"),
    host: formData.get("host") ?? undefined,
    port: formData.get("port") ?? undefined,
    from: formData.get("from"),
    user: formData.get("user") ?? undefined,
    password: formData.get("password") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]!.message };
  }

  const { from, user, password } = parsed.data;
  const provider = getEmailProvider(parsed.data.provider);

  // Host, port and the fixed username come from the preset table, never from
  // the request — a tampered form cannot point a known provider id at another
  // server. Only "custom" reads them off the form.
  let host: string;
  let port: number;
  if (provider.host !== null && provider.port !== null) {
    host = provider.host;
    port = provider.port;
  } else {
    const customHost = parsed.data.host;
    if (!customHost) return { error: "Enter an SMTP host" };
    const parsedPort = portSchema.safeParse(parsed.data.port);
    if (!parsedPort.success) {
      return { error: parsedPort.error.issues[0]!.message };
    }
    host = customHost;
    port = parsedPort.data;
  }

  // Resend and SendGrid authenticate as a fixed literal username; the form
  // hides the field for them, so accepting one from the request would only
  // create a way to get it wrong.
  const trimmedUser = provider.fixedUser ?? (user?.trim() || null);

  if (provider.needsCredential && !trimmedUser) {
    return { error: `${provider.label} requires a username.` };
  }

  // Password handling, in precedence order:
  //
  //  1. No username  -> no password. lib/email.ts only sends credentials when
  //     both are present, so a password without a user is dead data that the
  //     admin view would still report as `hasPassword: true`. This wins even
  //     when a new password was typed in the same save, since storing one that
  //     can never be used is worse than dropping it.
  //  2. Password typed -> store it, encrypted.
  //  3. Password blank -> leave the stored one alone. The form cannot render
  //     the existing value back, so treating blank as a deletion would
  //     silently wipe it on every unrelated edit. Clearing is a separate,
  //     explicit action.
  const passwordUpdate =
    trimmedUser === null
      ? { smtpPassEncrypted: null }
      : password && password.length > 0
        ? { smtpPassEncrypted: encryptSecret(password, SECRET_LABELS.SMTP_PASSWORD) }
        : {};

  const data = {
    smtpProvider: provider.id,
    smtpHost: host,
    smtpPort: port,
    smtpFrom: from,
    smtpUser: trimmedUser,
    ...passwordUpdate,
  };

  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  });

  await logAudit({
    actorId: actor.id,
    action: `Updated the email settings (${provider.label}, ${host}:${port})`,
    actionCode: "settings.email.updated",
    method: "POST",
    statusCode: 200,
    targetLabel: "Email settings",
    // Never the password or its ciphertext: audit metadata renders in the
    // expanded log row and is exported to CSV by
    // app/account/audit-logs/export/route.ts.
    metadata: {
      provider: provider.id,
      host,
      port,
      from,
      user: trimmedUser,
      // Whether *this save* set a password — not whether one is stored, which
      // the "leave unchanged" branch deliberately doesn't look up.
      passwordChanged: Boolean(
        "smtpPassEncrypted" in passwordUpdate && passwordUpdate.smtpPassEncrypted,
      ),
    },
  });

  revalidateEmailSettings();
  return { ok: true };
}

export async function clearEmailSettings(): Promise<EmailSettingsActionState> {
  const actor = await requireAdmin();

  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {
      smtpProvider: null,
      smtpHost: null,
      smtpPort: null,
      smtpFrom: null,
      smtpUser: null,
      smtpPassEncrypted: null,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "Cleared the SMTP settings",
    actionCode: "settings.email.cleared",
    method: "POST",
    statusCode: 200,
    targetLabel: "Email settings",
  });

  revalidateEmailSettings();
  return { ok: true };
}

const testSchema = z.object({ to: z.email("Enter a valid email address") });

/**
 * Tests the *saved* configuration, so the flow is Save, then Send test.
 * Testing unsaved form values would mean shipping the password through a
 * second round-trip and duplicating the resolution path, letting the test
 * diverge from what actually sends.
 */
export async function sendTestEmail(
  _prev: EmailSettingsActionState,
  formData: FormData,
): Promise<EmailSettingsActionState> {
  const actor = await requireAdmin();

  const parsed = testSchema.safeParse({
    to: formData.get("to") || actor.email,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]!.message };
  }
  const { to } = parsed.data;
  const { appName } = await getAppSettings();

  try {
    await sendEmail({
      to,
      subject: `Test email from ${appName}`,
      text: `This is a test message from ${appName}. If you received it, outgoing email is working.`,
      // Escaped like every other template: appName is admin-editable at
      // /admin/branding and its schema only trims and length-limits, so it can
      // contain `<` or `&`.
      html: `<p>This is a test message from ${escapeHtml(appName)}.</p><p>If you received it, outgoing email is working.</p>`,
    });
  } catch (error) {
    // Surfaced verbatim on purpose: this is an admin-only screen, and the
    // underlying message ("connect ECONNREFUSED 127.0.0.1:1026", "Invalid
    // login") is the entire diagnostic value of a test send.
    return { error: (error as Error).message };
  }

  await logAudit({
    actorId: actor.id,
    action: `Sent a test email to ${to}`,
    actionCode: "settings.email.test_sent",
    method: "POST",
    statusCode: 200,
    targetLabel: to,
  });

  return { ok: true, sentTo: to };
}
