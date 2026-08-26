import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/tokens";
import type { Role, UserStatus } from "@/lib/generated/prisma/enums";

export type ApiTokenAuth = {
  token: { id: string; scopes: string[] };
  user: { id: string; email: string; role: Role; status: UserStatus };
};

/**
 * Bearer-token authentication for machine API routes (app/api/*), distinct
 * from requireUser()'s session path — no redirect, no DeviceSession, just a
 * hash lookup. Reuses hashToken() from lib/auth/tokens.ts so a presented
 * token is never compared or stored in plaintext.
 *
 * Returns null uniformly for every failure (missing/malformed header,
 * unknown token, revoked, expired, or an account that can no longer hold a
 * session at all) rather than distinguishing which — mirroring
 * getCurrentUser()'s soft-delete/suspended checks so the same account state
 * is honored on both the session and token paths. Scopes are returned but
 * not yet enforced here — see ROADMAP 2.5.
 */
export async function authenticateApiToken(
  request: Request,
): Promise<ApiTokenAuth | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const plaintext = header.slice("Bearer ".length).trim();
  if (!plaintext) return null;

  const token = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(plaintext) },
    select: {
      id: true,
      scopes: true,
      revokedAt: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!token || token.revokedAt) return null;
  if (token.expiresAt && token.expiresAt < new Date()) return null;
  if (token.user.deletedAt || token.user.status === "SUSPENDED") return null;

  return {
    token: { id: token.id, scopes: token.scopes },
    user: {
      id: token.user.id,
      email: token.user.email,
      role: token.user.role,
      status: token.user.status,
    },
  };
}
