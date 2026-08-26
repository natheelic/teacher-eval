import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/permissions";
import { DELETION_GRACE_PERIOD_MS, softDeleteUser } from "@/lib/auth/deletion";
import { logAudit } from "@/lib/audit";
import type { Role, UserStatus } from "@/lib/generated/prisma/enums";

export type CurrentUser = {
  id: string;
  sid: string | null;
  name: string | null;
  email: string;
  image: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  role: Role;
  status: UserStatus;
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
      role: true,
      status: true,
      passwordHash: true,
      twoFactorEnabled: true,
      deletionRequestedAt: true,
      deletedAt: true,
    },
  });

  if (!user) return null;

  // The grace period has no scheduled job behind it — it is enforced lazily,
  // here, the one place every authenticated request already passes through.
  if (
    user.deletionRequestedAt &&
    Date.now() - user.deletionRequestedAt.getTime() >= DELETION_GRACE_PERIOD_MS
  ) {
    await softDeleteUser(user.id);
    await logAudit({
      actorId: user.id,
      targetUserId: user.id,
      action: "Account deleted after grace period",
      actionCode: "user.deleted",
      method: "GET",
      statusCode: 200,
    });
    return null;
  }

  // A suspended account keeps its rows but must not hold a usable session.
  if (user.deletedAt || user.status === "SUSPENDED") return null;

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
    role: user.role,
    status: user.status,
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

export const SET_PASSWORD_PATH = "/account/set-password";

/**
 * Use in every protected page and Server Action. Redirects rather than throws
 * so an expired or revoked session lands the user back on sign-in.
 *
 * Also gates on `hasPassword`: an account with no password (currently only
 * possible via Google) has no working credentials-recovery path, so it is
 * sent to set one before it can reach anything else. The set-password page
 * and its own Server Action are exempted via the pathname the proxy forwards
 * — without that, redirecting there would redirect right back to itself.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  if (!user.hasPassword && (await currentPathname()) !== SET_PASSWORD_PATH) {
    redirect(SET_PASSWORD_PATH);
  }

  return user;
}

async function currentPathname(): Promise<string | null> {
  try {
    return (await headers()).get("x-pathname");
  } catch {
    return null;
  }
}

/**
 * Guards the user-management area. Redirects rather than throwing so a member
 * who follows a stale link lands somewhere sensible instead of on an error.
 */
export async function requireUserManager(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!canManageUsers(user.role)) redirect("/account/preferences");
  return user;
}
