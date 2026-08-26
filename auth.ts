import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { parseDevice, clientIpFrom } from "@/lib/auth/device";
import { cancelPendingDeletion } from "@/lib/auth/deletion";
import { verifyTotpCode, decryptTwoFactorSecret } from "@/lib/auth/totp";

/**
 * Thrown by authorize() instead of returning null when the password is
 * correct but the account has 2FA enabled and no valid code was submitted.
 * signInAction distinguishes this from a plain wrong-password CredentialsSignin
 * to reveal the code field. The static `type` must be set explicitly — JS
 * static properties inherit through `extends`, so an unset subclass would
 * silently report its parent's "CredentialsSignin" type instead.
 */
export class TwoFactorRequired extends CredentialsSignin {}
TwoFactorRequired.type = "TwoFactorRequired";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  code: z.string().trim().regex(/^\d{6}$/).optional(),
});

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // Even under the JWT strategy the adapter still runs createUser /
  // getUserByAccount / linkAccount, so Google sign-ins produce real User and
  // Account rows. It just never writes to the Session table.
  adapter: PrismaAdapter(prisma),

  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password, code } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            deletedAt: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
          },
        });

        // verifyPassword still runs bcrypt when passwordHash is null, so a
        // missing account and a wrong password take about the same time.
        const ok = await verifyPassword(password, user?.passwordHash ?? null);
        if (!user || !ok || user.deletedAt) return null;

        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const secret = decryptStoredSecret(user.twoFactorSecret);
          if (!code || !secret || !(await verifyTotpCode(secret, code))) {
            throw new TwoFactorRequired();
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    /**
     * The Credentials provider already refuses a deleted/suspended account in
     * `authorize()`. An OAuth provider has no equivalent step in Auth.js core
     * — it resolves a returning sign-in by `providerAccountId`, not email, so
     * without this a soft-deleted user's Google identity would silently sign
     * back in as that same dead row (`requireUser()` would then bounce it
     * right back to `/signin` with no explanation). `softDeleteUser()` also
     * deletes the `Account` row itself, so this is defense-in-depth for
     * anything created before that existed.
     */
    async signIn({ account }) {
      if (!account || account.provider === "credentials") return true;

      const existing = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        select: { user: { select: { deletedAt: true, status: true } } },
      });

      if (existing?.user.deletedAt || existing?.user.status === "SUSPENDED") {
        return false;
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      // Initial sign-in: stamp the user id and open a DeviceSession whose id
      // becomes the token's `sid`, so the security page can list and revoke it.
      if (user?.id) {
        token.uid = user.id;
        token.sid = await createDeviceSession(user.id);
        // Successfully signing back in — Credentials or OAuth — cancels a
        // pending self-deletion request automatically, without requiring a
        // separate trip to /account/preferences to click Cancel.
        await Promise.all([
          cancelPendingDeletion(user.id),
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }),
        ]);
      }

      if (trigger === "update" && token.uid) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.uid },
          select: { name: true, email: true, image: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.email = fresh.email;
          token.picture = fresh.image;
        }
      }

      return token;
    },

    session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      if (token.sid) session.user.sid = token.sid;
      return session;
    },
  },

  events: {
    /**
     * Google sign-ins skip `authorize`, so their DeviceSession is created here
     * only if the jwt callback has not already made one for this login.
     */
    async signOut(message) {
      const sid = "token" in message ? message.token?.sid : undefined;
      if (!sid) return;
      await prisma.deviceSession
        .updateMany({
          where: { id: sid, revokedAt: null },
          data: { revokedAt: new Date() },
        })
        .catch(() => {
          // Signing out must succeed even if the bookkeeping write fails.
        });
    },
  },
});

/**
 * Fails closed rather than throwing: a stored secret that won't decrypt
 * (corruption, a wrong/rotated AUTH_SECRET) must block sign-in the same way
 * a wrong code does, never crash the request or silently skip the check.
 */
function decryptStoredSecret(ciphertext: string): string | null {
  try {
    return decryptTwoFactorSecret(ciphertext);
  } catch {
    return null;
  }
}

/**
 * Records the device a session was opened from. Header access is wrapped
 * because `headers()` is unavailable in some Auth.js call paths (e.g. the
 * OAuth callback leg), and a missing User-Agent must not break sign-in.
 */
async function createDeviceSession(userId: string): Promise<string> {
  const id = randomUUID();

  let userAgent: string | null = null;
  let ipAddress: string | null = null;

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    userAgent = h.get("user-agent");
    ipAddress = clientIpFrom(h);
  } catch {
    // No request context available — fall back to an unlabelled session.
  }

  const device = parseDevice(userAgent, ipAddress);

  await prisma.deviceSession.create({
    data: {
      id,
      userId,
      deviceLabel: device.deviceLabel,
      deviceType: device.deviceType,
      userAgent: device.userAgent,
      ipAddress: device.ipAddress,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  return id;
}
