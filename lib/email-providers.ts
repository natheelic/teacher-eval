/**
 * The closed vocabulary of email providers offered at /admin/email (ROADMAP 7.5).
 *
 * Every provider here is reached over plain SMTP — Resend and SendGrid both
 * accept an API key as the SMTP password against a fixed username, so no
 * HTTP-API client is needed and `lib/email.ts` keeps a single send path. The
 * dropdown is purely a way to stop asking administrators for a hostname and
 * port they'd otherwise have to look up.
 *
 * No secrets and no Prisma here, so this is safe to import from the Client
 * Component that renders the picker — same reasoning as lib/action-codes.ts.
 *
 * `host`/`port` are resolved **server-side** from this table (see
 * lib/actions/email-settings.ts). A tampered request cannot smuggle in a
 * different host under a known provider id, the same closed-set discipline
 * API-token scopes already use.
 */

export type EmailProviderId =
  | "gmail"
  | "outlook"
  | "resend"
  | "sendgrid"
  | "mailpit"
  | "custom";

export type EmailProvider = {
  id: EmailProviderId;
  label: string;
  /** null means the administrator supplies it (custom only). */
  host: string | null;
  port: number | null;
  /** Providers that authenticate with a fixed username plus an API key. */
  fixedUser: string | null;
  /** False for a local catch-all server that accepts anything. */
  needsCredential: boolean;
  /** What the secret is actually called on that provider's dashboard. */
  credentialLabel: string;
  hint: string;
};

export const EMAIL_PROVIDERS: readonly EmailProvider[] = [
  {
    id: "gmail",
    label: "Gmail / Google Workspace",
    host: "smtp.gmail.com",
    port: 587,
    fixedUser: null,
    needsCredential: true,
    credentialLabel: "App password",
    hint: "Use the full Gmail address as the username. Google requires 2-Step Verification and a 16-character App Password — your normal account password will be rejected.",
  },
  {
    id: "outlook",
    label: "Outlook / Microsoft 365",
    host: "smtp-mail.outlook.com",
    port: 587,
    fixedUser: null,
    needsCredential: true,
    credentialLabel: "App password",
    hint: "Use the full email address as the username. Many Microsoft 365 tenants have SMTP basic authentication disabled by default — if sending fails with an auth error, it has to be enabled for the mailbox first.",
  },
  {
    id: "resend",
    label: "Resend",
    host: "smtp.resend.com",
    port: 465,
    fixedUser: "resend",
    needsCredential: true,
    credentialLabel: "API key",
    hint: "Paste the API key from the Resend dashboard. The username is always \"resend\", so it is set automatically. The From address must use a domain you have verified with Resend.",
  },
  {
    id: "sendgrid",
    label: "SendGrid",
    host: "smtp.sendgrid.net",
    port: 587,
    fixedUser: "apikey",
    needsCredential: true,
    credentialLabel: "API key",
    hint: "Paste the API key from the SendGrid dashboard. The username is always the literal \"apikey\", so it is set automatically. The From address must be a verified sender.",
  },
  {
    id: "mailpit",
    label: "Mailpit (local development)",
    host: "localhost",
    port: 1025,
    fixedUser: null,
    needsCredential: false,
    credentialLabel: "Password",
    hint: "The catch-all server from docker-compose.yml. It accepts every address and relays nothing — mail never leaves this machine, and is readable at http://localhost:8025.",
  },
  {
    id: "custom",
    label: "Custom SMTP server",
    host: null,
    port: null,
    fixedUser: null,
    needsCredential: false,
    credentialLabel: "Password",
    hint: "Enter the hostname and port supplied by your mail provider.",
  },
] as const;

export const DEFAULT_PROVIDER_ID: EmailProviderId = "custom";

export function getEmailProvider(id: string | null | undefined): EmailProvider {
  return (
    EMAIL_PROVIDERS.find((p) => p.id === id) ??
    EMAIL_PROVIDERS.find((p) => p.id === DEFAULT_PROVIDER_ID)!
  );
}

export function isEmailProviderId(value: unknown): value is EmailProviderId {
  return EMAIL_PROVIDERS.some((p) => p.id === value);
}
