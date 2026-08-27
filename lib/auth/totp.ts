import { generateSecret, generateURI, verify } from "otplib";
import { SECRET_LABELS, decryptSecret, encryptSecret } from "@/lib/secret-box";
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

/**
 * Deliberately uses the build-time `appName` from lib/app-config.ts, NOT the
 * runtime one from getAppSettings() (ROADMAP 7.1).
 *
 * The issuer is written once into a third-party authenticator app on someone's
 * phone and can never be updated from here. Renaming the site would not lock
 * anyone out — verifyTotpCode() only reads the secret — but it would leave a
 * permanently split list, entries enrolled before the rename showing the old
 * name and entries after showing the new one, with no migration path. A value
 * that escapes into software we don't control should be stable.
 */
export function buildOtpAuthUrl(secret: string, email: string): string {
  return generateURI({ issuer: appName, label: email, secret });
}

const PENDING_ENROLLMENT_TTL_MS = 10 * 60 * 1000;

type PendingPayload = { secret: string; userId: string; iat: number };

/**
 * Carries a freshly-generated, not-yet-persisted TOTP secret from the "show
 * QR" step to the "confirm code" step as an opaque, self-expiring,
 * user-bound token — never as a raw secret sitting in a hidden form field.
 */
export function encryptPendingSecret(secret: string, userId: string): string {
  const payload: PendingPayload = { secret, userId, iat: Date.now() };
  return encryptSecret(JSON.stringify(payload), SECRET_LABELS.TWO_FACTOR_PENDING);
}

/** Returns null on any failure: bad token, expired, or bound to another user. */
export function decryptPendingSecret(token: string, userId: string): string | null {
  try {
    const plaintext = decryptSecret(token, SECRET_LABELS.TWO_FACTOR_PENDING);
    const payload = JSON.parse(plaintext) as PendingPayload;
    if (payload.userId !== userId) return null;
    if (Date.now() - payload.iat > PENDING_ENROLLMENT_TTL_MS) return null;
    return payload.secret;
  } catch {
    return null;
  }
}

/**
 * `User.twoFactorSecret` at rest (ROADMAP 5.9). Unlike the pending-enrollment
 * token above, this has no expiry or user binding baked in — it's a
 * long-lived value, decrypted fresh on every sign-in, not a short-lived
 * handoff between two steps of one flow. It must stay decryptable (unlike a
 * password hash, which only ever needs comparing), so encryption — not
 * hashing — is the only option.
 */
export function encryptTwoFactorSecret(secret: string): string {
  return encryptSecret(secret, SECRET_LABELS.TWO_FACTOR_AT_REST);
}

/** Throws on a malformed or tampered value — a stored secret failing to
 * decrypt is a real integrity problem, not a normal "try again" case. */
export function decryptTwoFactorSecret(ciphertext: string): string {
  return decryptSecret(ciphertext, SECRET_LABELS.TWO_FACTOR_AT_REST);
}
