import { prisma } from "@/lib/prisma";

/** How long a self-requested deletion waits before it actually happens. */
export const DELETION_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The soft-delete transaction shared by the admin delete action and the
 * grace-period expiry check in `requireUser()`: set `deletedAt`, force
 * `SUSPENDED`, release the email/username, and revoke every device session.
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
  });
}
