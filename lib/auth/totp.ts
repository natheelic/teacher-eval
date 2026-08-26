import { generateSecret, generateURI, verify } from "otplib";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";
import { appName } from "@/lib/app-config";

export function generateTotpSecret(): string {
  return generateSecret();
}

/** epochTolerance in seconds — tolerates one 30s step of clock skew either way. */
export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  try {
    const result = await verify({ secret, token: code, epochTolerance: 30 });
    return result.valid;
  } catch {
    return false;
  }
}

export function buildOtpAuthUrl(secret: string, email: string): string {
  return generateURI({ issuer: appName, label: email, secret });
}

const PENDING_ENROLLMENT_TTL_MS = 10 * 60 * 1000;

/** Derived from AUTH_SECRET — already a trusted, high-entropy secret in this app. */
function encryptionKey(): Buffer {
  return createHash("sha256").update(`${env.AUTH_SECRET}:2fa-pending`).digest();
}

type PendingPayload = { secret: string; userId: string; iat: number };

/**
 * Carries a freshly-generated, not-yet-persisted TOTP secret from the "show
 * QR" step to the "confirm code" step as an opaque, self-expiring,
 * user-bound token — never as a raw secret sitting in a hidden form field.
 */
export function encryptPendingSecret(secret: string, userId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const payload: PendingPayload = { secret, userId, iat: Date.now() };
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext]
    .map((b) => b.toString("base64url"))
    .join(".");
}

/** Returns null on any failure: bad token, expired, or bound to another user. */
export function decryptPendingSecret(token: string, userId: string): string | null {
  try {
    const [ivB64, tagB64, ciphertextB64] = token.split(".");
    if (!ivB64 || !tagB64 || !ciphertextB64) return null;

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivB64, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, "base64url")),
      decipher.final(),
    ]).toString("utf8");

    const payload = JSON.parse(plaintext) as PendingPayload;
    if (payload.userId !== userId) return null;
    if (Date.now() - payload.iat > PENDING_ENROLLMENT_TTL_MS) return null;
    return payload.secret;
  } catch {
    return null;
  }
}
