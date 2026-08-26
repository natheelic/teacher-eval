import { z } from "zod";

/**
 * Server-side environment. Parsed once, at import time, so a missing or
 * malformed variable fails the boot instead of surfacing as a confusing
 * runtime error deep inside a query or an auth callback.
 *
 * Never import this from a Client Component — it would leak secrets into the
 * browser bundle. Client-safe values go through NEXT_PUBLIC_* instead.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  AUTH_SECRET: z
    .string()
    .min(1, "AUTH_SECRET is required — generate one with `npx auth secret`"),
  AUTH_URL: z.url().optional(),

  // Optional: the Google provider is only registered when both are present.
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // Optional, same pattern as Google above: email-dependent features (invite
  // links today; verification/reset later) are only enabled when the three
  // required fields are present. SMTP_USER/SMTP_PASS are separately optional
  // since a local Mailpit/MailHog dev server needs no auth.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Declared here to be *validated*, not to be read — read them from
  // lib/app-config.ts, which is the browser-safe module.
  //
  // They are required rather than optional on purpose: the failure being
  // guarded against is a misspelled variable name, and an optional field would
  // accept that silently. Without this, a typo'd NEXT_PUBLIC_APP_DOMAIN falls
  // back to a default and every project URL on the dashboard is quietly wrong.
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .min(1, "NEXT_PUBLIC_APP_NAME is required — see .env.example"),
  NEXT_PUBLIC_APP_DOMAIN: z
    .string()
    .min(1, "NEXT_PUBLIC_APP_DOMAIN is required — see .env.example")
    .refine(
      (value) => !value.includes("://") && !value.includes("/"),
      "NEXT_PUBLIC_APP_DOMAIN must be a bare hostname (e.g. portal.example.com), not a URL",
    ),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables:\n${issues}\n\nCopy .env.example to .env and fill it in.`,
  );
}

export const env = parsed.data;

/** Google is wired up only when both halves of the credential are present. */
export const googleEnabled = Boolean(
  env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET,
);

/** Email-dependent features (invitations) are only enabled when all three are present. */
export const emailEnabled = Boolean(
  env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM,
);

// Client-safe display values (appName / appDomain) intentionally live in
// lib/app-config.ts — re-exporting them here would let a Client Component pull
// in this module and throw on the missing server secrets.
