"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import {
  hashPassword,
  passwordSchema,
  verifyPassword,
} from "@/lib/auth/password";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "@/lib/actions/profile";

const changeSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: passwordSchema,
});

/**
 * Changing the password revokes every *other* device session. A JWT is
 * self-contained, so without this an attacker holding a token issued before
 * the change would stay signed in until it expired on its own.
 */
export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = changeSchema.safeParse({
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { fieldErrors };
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  // Users who signed up through Google have no password yet and are *setting*
  // one, so the current-password check only applies when one already exists.
  if (row?.passwordHash) {
    const current = parsed.data.currentPassword ?? "";
    const ok = await verifyPassword(current, row.passwordHash);
    if (!ok) {
      return { fieldErrors: { currentPassword: "Incorrect password." } };
    }
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    }),
    prisma.deviceSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
        ...(user.sid ? { NOT: { id: user.sid } } : {}),
      },
      data: { revokedAt: new Date() },
    }),
  ]);

  await logAudit({
    actorId: user.id,
    action: row?.passwordHash ? "Changed password" : "Set a password",
    actionCode: "account.password.changed",
    method: "POST",
    statusCode: 200,
    targetUserId: user.id,
  });

  revalidatePath("/account/preferences");
  revalidatePath("/account/security");
  return { ok: true };
}

export async function revokeDeviceSession(sessionId: string): Promise<void> {
  const user = await requireUser();

  // Scoped by userId so one user can never revoke another's session.
  await prisma.deviceSession.updateMany({
    where: { id: sessionId, userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await logAudit({
    actorId: user.id,
    action: "Revoked a session",
    actionCode: "account.session.revoked",
    method: "POST",
    statusCode: 200,
    targetUserId: user.id,
    targetLabel: "Device session",
  });

  revalidatePath("/account/security");
}

export async function revokeAllOtherSessions(): Promise<void> {
  const user = await requireUser();

  await prisma.deviceSession.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
      ...(user.sid ? { NOT: { id: user.sid } } : {}),
    },
    data: { revokedAt: new Date() },
  });

  await logAudit({
    actorId: user.id,
    action: "Signed out all other sessions",
    actionCode: "account.session.revoked_all",
    method: "POST",
    statusCode: 200,
  });

  revalidatePath("/account/security");
}

export async function setTwoFactorEnabled(enabled: boolean): Promise<void> {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: enabled },
  });

  await logAudit({
    actorId: user.id,
    action: enabled
      ? "Enabled two-factor authentication"
      : "Disabled two-factor authentication",
    actionCode: enabled ? "account.2fa.enabled" : "account.2fa.disabled",
    method: "POST",
    statusCode: 200,
    targetUserId: user.id,
  });

  revalidatePath("/account/security");
}
