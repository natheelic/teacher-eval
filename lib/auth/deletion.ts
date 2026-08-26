import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

/** How long a self-requested deletion waits before it actually happens. */
export const DELETION_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Clears a pending deletion request, if any, and audits it. Shared by the
 * explicit "Cancel deletion request" action and the sign-in hook that
 * cancels automatically — successfully signing back in (Credentials or
 * OAuth) is the same trust bar as clicking Cancel, so it's treated the same
 * way. Scoped with a conditional update so signing in on an account with no
 * pending request never writes a spurious audit row.
 *
 * Deliberately excludes a request whose grace period has already elapsed:
 * the sign-in hook runs inside `jwt()`, which fires *before* the page load
 * that follows ever reaches `getCurrentUser()`'s lazy expiry check. Without
 * this bound, signing in one day after the 30-day deadline would silently
 * cancel the overdue deletion instead of letting that same page load enact
 * it — permanently defeating FR-61a for anyone who just waits past day 30
 * before signing back in.
 */
export async function cancelPendingDeletion(userId: string): Promise<void> {
  const { count } = await prisma.user.updateMany({
    where: {
      id: userId,
      deletionRequestedAt: {
        not: null,
        gt: new Date(Date.now() - DELETION_GRACE_PERIOD_MS),
      },
    },
    data: { deletionRequestedAt: null },
  });
  if (count === 0) return;

  await logAudit({
    actorId: userId,
    targetUserId: userId,
    action: "Cancelled account deletion request",
    actionCode: "account.deletion.cancelled",
    method: "POST",
    statusCode: 200,
  });
}

/**
 * The soft-delete transaction shared by the admin delete action and the
 * grace-period expiry check in `requireUser()`: set `deletedAt`, force
 * `SUSPENDED`, release the email/username, revoke every device session, and
 * unlink every OAuth `Account`.
 *
 * The `Account` unlink matters because Google (and any OAuth provider) keys a
 * returning sign-in by `providerAccountId`, not email. Without deleting these
 * rows, a Google sign-in with the same identity would resolve straight back
 * to this now-deleted `User` row — Auth.js has no status check on that path,
 * so it would issue a session for it, and only `requireUser()` would catch it
 * afterward, bouncing the user back to `/signin` with no explanation. This
 * way the identity is fully released, the same as the email/username, so a
 * fresh sign-in creates a brand new account instead.
 */
export async function softDeleteUser(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: "SUSPENDED",
        email: `deleted+${userId}@invalid.local`,
        username: null,
      },
    });
    await tx.deviceSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.account.deleteMany({ where: { userId } });
  });
}
