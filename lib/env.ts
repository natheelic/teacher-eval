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

// Client-safe display values (appName / appDomain) intentionally live in
// lib/app-config.ts — re-exporting them here would let a Client Component pull
// in this module and throw on the missing server secrets.
