import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  sid: string | null;
  name: string | null;
  email: string;
  image: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  deletionRequestedAt: Date | null;
};

/**
 * The single place a protected request touches the database to validate its
 * session. The proxy can only check that a JWT exists; because a JWT is
 * self-contained, revocation and account deletion are only observable here.
 *
 * Wrapped in React's `cache` so the many callers within one render — the
 * header, the page, each section — share a single query.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const sid = session.user.sid ?? null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      firstName: true,
      lastName: true,
      username: true,
      passwordHash: true,
      twoFactorEnabled: true,
      deletionRequestedAt: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) return null;

  // A revoked device session invalidates the token even though the token
  // itself is still cryptographically valid.
  if (sid) {
    const device = await prisma.deviceSession.findUnique({
      where: { id: sid },
      select: { revokedAt: true, expiresAt: true, lastActiveAt: true },
    });
    if (!device || device.revokedAt || device.expiresAt < new Date()) {
      return null;
    }
    void touchDeviceSession(sid, device.lastActiveAt);
  }

  return {
    id: user.id,
    sid,
    name: user.name,
    email: user.email,
    image: user.image,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    hasPassword: Boolean(user.passwordHash),
    twoFactorEnabled: user.twoFactorEnabled,
    deletionRequestedAt: user.deletionRequestedAt,
  };
});

const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/** Throttled so a normal page view does not cost an extra write. */
async function touchDeviceSession(sid: string, lastActiveAt: Date) {
  if (Date.now() - lastActiveAt.getTime() < TOUCH_INTERVAL_MS) return;
  await prisma.deviceSession
    .update({ where: { id: sid }, data: { lastActiveAt: new Date() } })
    .catch(() => {
      // Best effort — never fail a page render over a timestamp.
    });
}

/**
 * Use in every protected page and Server Action. Redirects rather than throws
 * so an expired or revoked session lands the user back on sign-in.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}
