import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/tokens";

/**
 * Generic one-time-link tokens, shared by invitations and email verification
 * — both need "prove you control this address" and nothing else. Reuses the
 * Auth.js adapter's VerificationToken model rather than a new table: it's
 * part of the schema already (composite `[identifier, token]` PK) and
 * otherwise sits completely unused, since no Email provider is registered.
 *
 * `identifier` is the target email; `token` is stored as a SHA-256 hash
 * (hashToken(), the same function API tokens use), never the raw value that
 * goes out in the link. Consuming a token deletes its row, so a used or
 * expired link can never be replayed.
 */
export async function createVerificationToken(
  email: string,
  ttlMs: number,
): Promise<string> {
  const plaintext = randomBytes(32).toString("base64url");

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashToken(plaintext),
      expires: new Date(Date.now() + ttlMs),
    },
  });

  return plaintext;
}

/** Returns the target email, or null for anything that doesn't resolve to a live token. */
export async function consumeVerificationToken(
  plaintext: string,
): Promise<string | null> {
  const row = await prisma.verificationToken.findFirst({
    where: { token: hashToken(plaintext), expires: { gt: new Date() } },
  });
  if (!row) return null;

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: row.identifier, token: row.token } },
  });

  return row.identifier;
}
