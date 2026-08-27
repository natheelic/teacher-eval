"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUserManager } from "@/lib/auth/require-session";
import { hashPassword, passwordSchema } from "@/lib/auth/password";
import { softDeleteUser } from "@/lib/auth/deletion";
import { uniqueUsername } from "@/lib/bootstrap";
import { sendInvitationEmail } from "@/lib/auth/invitations";
import { isEmailEnabled } from "@/lib/email-config";
import { logAudit } from "@/lib/audit";
import {
  ROLE_LABELS,
  canActOnUser,
  canAssignRole,
  canDeleteUsers,
} from "@/lib/permissions";
import type { Role } from "@/lib/generated/prisma/enums";
import type { ActionState } from "@/lib/actions/profile";

const roleEnum = z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]);

/**
 * Loads the target and confirms the caller may act on it.
 *
 * Every mutation below goes through this. The proxy cannot help here — it has
 * no database access — so authorization happens on the Node side, and the UI's
 * disabled buttons are treated as a hint, never as a guarantee.
 */
async function loadActionable(targetId: string) {
  const actor = await requireUserManager();

  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: { id: true, email: true, name: true, role: true, status: true },
  });
  if (!target) throw new Error("User not found");

  if (!canActOnUser(actor, target)) {
    throw new Error("Insufficient permissions to modify this user");
  }

  return { actor, target };
}

function labelOf(user: { name: string | null; email: string }) {
  return user.name?.trim() || user.email;
}

// --- create ----------------------------------------------------------------

const createSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.email("Enter a valid email address"),
  role: roleEnum,
});

/**
 * Invites a user by email rather than setting a password on their behalf —
 * the account is created with status INVITED and no passwordHash, an
 * invitation link is emailed, and the invitee sets their own password when
 * they accept it (lib/actions/invitations.ts). Requires email to be
 * configured (ROADMAP 3.1); with none, this fails before creating anything
 * rather than leaving a stuck INVITED row nobody can activate.
 */
export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUserManager();

  if (!(await isEmailEnabled())) {
    return {
      error:
        "Email isn't configured — ask an admin to set it up in the admin panel before inviting users.",
    };
  }

  const parsed = createSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { firstName, lastName, role } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  // A manager must not be able to mint a role at or above their own.
  if (!canAssignRole(actor.role, role)) {
    return { fieldErrors: { role: "You cannot assign that role." } };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }

  const created = await prisma.$transaction(async (tx) =>
    tx.user.create({
      data: {
        email,
        name: [firstName, lastName].filter(Boolean).join(" "),
        firstName,
        lastName: lastName ?? null,
        username: await uniqueUsername(tx, email),
        role,
        status: "INVITED",
        invitedById: actor.id,
        preferences: { create: {} },
      },
      select: { id: true, email: true, name: true },
    }),
  );

  await sendInvitationEmail(email, labelOf(actor));

  await logAudit({
    actorId: actor.id,
    targetUserId: created.id,
    targetLabel: labelOf(created),
    action: `Invited user with role ${ROLE_LABELS[role]}`,
    actionCode: "user.invited",
    method: "POST",
    statusCode: 201,
  });

  revalidatePath("/users");
  return { ok: true };
}

/**
 * Re-sends the invitation email with a fresh token (the original may have
 * expired, or the email may simply have gone unnoticed). The prior token
 * isn't explicitly revoked — it's already single-use via
 * consumeInvitationToken() and expires on its own — so there's nothing to
 * clean up beyond leaving an unused, eventually-expired row.
 */
export async function resendInvitation(userId: string): Promise<void> {
  const { actor, target } = await loadActionable(userId);

  if (target.status !== "INVITED") {
    throw new Error("This user has already accepted their invitation.");
  }
  if (!(await isEmailEnabled())) {
    throw new Error(
      "Email isn't configured — ask an admin to set it up in the admin panel before resending invitations.",
    );
  }

  await sendInvitationEmail(target.email, labelOf(actor));

  await logAudit({
    actorId: actor.id,
    targetUserId: target.id,
    targetLabel: labelOf(target),
    action: "Resent the invitation email",
    actionCode: "user.invitation.resent",
    method: "POST",
    statusCode: 200,
  });
}

// --- update ----------------------------------------------------------------

export async function changeUserRole(
  userId: string,
  role: Role,
): Promise<void> {
  const parsedRole = roleEnum.safeParse(role);
  if (!parsedRole.success) return;

  const { actor, target } = await loadActionable(userId);

  if (!canAssignRole(actor.role, parsedRole.data)) {
    throw new Error("Insufficient permissions to assign that role");
  }
  if (target.role === parsedRole.data) return;

  // Removing the last admin would leave the system unmanageable.
  if (target.role === "ADMIN" && parsedRole.data !== "ADMIN") {
    await assertNotLastAdmin(target.id);
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { role: parsedRole.data },
  });

  await logAudit({
    actorId: actor.id,
    targetUserId: target.id,
    targetLabel: labelOf(target),
    action: `Changed role from ${ROLE_LABELS[target.role]} to ${ROLE_LABELS[parsedRole.data]}`,
    actionCode: "user.role.changed",
    method: "POST",
    statusCode: 200,
  });

  revalidatePath("/users");
}

export async function setUserSuspended(
  userId: string,
  suspended: boolean,
): Promise<void> {
  const { actor, target } = await loadActionable(userId);

  if (suspended && target.role === "ADMIN") {
    await assertNotLastAdmin(target.id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: { status: suspended ? "SUSPENDED" : "ACTIVE" },
    });

    // Suspension must take effect immediately, so cut existing sessions.
    // requireUser() also rejects SUSPENDED, this just closes them cleanly.
    if (suspended) {
      await tx.deviceSession.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  });

  await logAudit({
    actorId: actor.id,
    targetUserId: target.id,
    targetLabel: labelOf(target),
    action: suspended ? "Suspended the account" : "Reactivated the account",
    actionCode: suspended ? "user.suspended" : "user.reactivated",
    method: "POST",
    statusCode: 200,
  });

  revalidatePath("/users");
}

export async function resetUserPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = String(formData.get("userId") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return {
      fieldErrors: { password: parsed.error.issues[0]?.message ?? "Invalid" },
    };
  }

  const { actor, target } = await loadActionable(userId);
  const passwordHash = await hashPassword(parsed.data);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    });
    // Any session issued before the reset must stop working.
    await tx.deviceSession.updateMany({
      where: { userId: target.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  await logAudit({
    actorId: actor.id,
    targetUserId: target.id,
    targetLabel: labelOf(target),
    action: "Reset the account password",
    actionCode: "user.password.reset",
    method: "POST",
    statusCode: 200,
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<void> {
  const { actor, target } = await loadActionable(userId);

  if (!canDeleteUsers(actor.role)) {
    throw new Error("Only admins can delete users");
  }
  if (target.role === "ADMIN") await assertNotLastAdmin(target.id);

  // Soft delete: every query filters on deletedAt, and it keeps audit rows
  // pointing at a real row. The email is released so it can be reused.
  await softDeleteUser(target.id);

  await logAudit({
    actorId: actor.id,
    targetUserId: target.id,
    targetLabel: labelOf(target),
    action: "Deleted the account",
    actionCode: "user.deleted",
    method: "DELETE",
    statusCode: 200,
  });

  revalidatePath("/users");
}

/**
 * Guards the one irreversible mistake this system can make: removing the final
 * admin, after which nobody can reach the users table at all.
 */
async function assertNotLastAdmin(excludingUserId: string) {
  const remaining = await prisma.user.count({
    where: {
      role: "ADMIN",
      deletedAt: null,
      status: { not: "SUSPENDED" },
      NOT: { id: excludingUserId },
    },
  });
  if (remaining === 0) {
    throw new Error(
      "This is the last active admin — promote another admin first.",
    );
  }
}
