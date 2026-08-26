import { createHash, randomBytes } from "node:crypto";

const PREFIX = "sk_live";

export type MintedToken = {
  /** Shown to the user exactly once, at creation. Never stored. */
  plaintext: string;
  tokenHash: string;
  prefix: string;
  last4: string;
};

export function mintToken(): MintedToken {
  const secret = randomBytes(24).toString("base64url");
  const plaintext = `${PREFIX}_${secret}`;

  return {
    plaintext,
    tokenHash: hashToken(plaintext),
    prefix: PREFIX,
    last4: secret.slice(-4),
  };
}

/**
 * SHA-256 rather than bcrypt: these are high-entropy random secrets, so there
 * is nothing to brute-force, and API auth needs a single indexed lookup.
 */
export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function tokenPreview(prefix: string, last4: string): string {
  return `${prefix}_${"•".repeat(8)}${last4}`;
}
