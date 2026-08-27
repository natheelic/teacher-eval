import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Symmetric encryption for values that must stay *decryptable* at rest —
 * unlike a password, which only ever needs comparing and so is hashed.
 *
 * Extracted from lib/auth/totp.ts when SMTP credentials (ROADMAP 7.2) became
 * the second consumer. Server-only: it reads AUTH_SECRET via lib/env.ts.
 *
 * Wire format is `iv.authTag.ciphertext`, each segment base64url, joined with
 * ".". AES-256-GCM, so a tampered ciphertext fails authentication on decrypt
 * rather than yielding garbage plaintext.
 */

/**
 * Key labels. Each purpose gets its own derived key, so a ciphertext minted
 * for one purpose can never be decrypted — or swapped in — as another.
 *
 * ⚠️ These strings are part of the at-rest data format. Changing one does not
 * migrate anything: it silently makes every value already encrypted under the
 * old label undecryptable. `TWO_FACTOR_AT_REST` in particular protects live
 * enrolled authenticators — changing it bricks every user's 2FA.
 */
export const SECRET_LABELS = {
  /** Short-lived handoff between the two 2FA enrollment steps. */
  TWO_FACTOR_PENDING: "2fa-pending",
  /** User.twoFactorSecret at rest. */
  TWO_FACTOR_AT_REST: "2fa-secret-at-rest",
  /** AppSettings.smtpPassEncrypted at rest. */
  SMTP_PASSWORD: "smtp-password",
} as const;

export type SecretLabel = (typeof SECRET_LABELS)[keyof typeof SECRET_LABELS];

/**
 * Derived from AUTH_SECRET — already a trusted, high-entropy secret in this
 * app. A distinct label per purpose so each key is cryptographically separate,
 * even though all of them ultimately derive from the same root secret.
 *
 * Note this couples every encrypted value to AUTH_SECRET: rotating it
 * invalidates all of them at once. That gap is documented in ROADMAP 5.9.
 */
function deriveKey(label: SecretLabel): Buffer {
  return createHash("sha256").update(`${env.AUTH_SECRET}:${label}`).digest();
}

export function encryptSecret(plaintext: string, label: SecretLabel): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(label), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((b) => b.toString("base64url")).join(".");
}

/**
 * Throws on a malformed, tampered, or wrong-label value. Callers that treat a
 * failure as an ordinary "try again" — rather than an integrity problem —
 * should catch; see decryptPendingSecret() and lib/email-config.ts, which
 * deliberately fail soft for opposite reasons.
 */
export function decryptSecret(value: string, label: SecretLabel): string {
  const [ivB64, tagB64, dataB64] = value.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted value");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveKey(label),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
