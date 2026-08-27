import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { type EmailConfig, getEmailConfig } from "@/lib/email-config";

/**
 * The transport is cached against a fingerprint of the config that built it,
 * rather than being built once for the process lifetime.
 *
 * Since SMTP settings are now editable at runtime (ROADMAP 7.2), a plain
 * singleton would keep serving the old transport until the process restarted.
 * The obvious alternative — an exported resetTransporter() called from the
 * save action — is worse than it looks: it only invalidates the Node instance
 * that happened to handle the save, leaving every other one stale. Re-deriving
 * from the resolved config is correct in every process, and costs one indexed
 * single-row read per outbound email. Outbound emails are rare.
 */
let cached: {
  key: string;
  transport: ReturnType<typeof nodemailer.createTransport>;
} | null = null;

/** Hashed so no plaintext copy of the password lives in a module-level string. */
function fingerprint(config: EmailConfig): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        config.host,
        config.port,
        config.from,
        config.user ?? "",
        config.pass ?? "",
      ]),
    )
    .digest("hex");
}

async function getTransporter(): Promise<{
  transport: ReturnType<typeof nodemailer.createTransport>;
  from: string;
}> {
  const config = await getEmailConfig();
  if (!config) {
    throw new Error(
      "Email is not configured — set it up in the admin panel under Email, or set SMTP_HOST, SMTP_PORT and SMTP_FROM.",
    );
  }

  const key = fingerprint(config);
  if (cached?.key !== key) {
    // The superseded transport is dropped, not close()d. A concurrent send
    // that resolved the old config a moment earlier may still be inside
    // sendMail() on it, and closing it here would pull the connection out from
    // under that request. These transports are non-pooled, so each send opens
    // and closes its own connection and there is nothing to leak.
    cached = {
      key,
      transport: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth:
          config.user && config.pass
            ? { user: config.user, pass: config.pass }
            : undefined,
      }),
    };
  }

  return { transport: cached.transport, from: config.from };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const { transport, from } = await getTransporter();
  await transport.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

/** Shared by every outbound HTML email that interpolates user-controlled text. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
