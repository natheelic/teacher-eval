"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import { verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional(),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(40)
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Use lowercase letters, numbers and hyphens",
    ),
});

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    username: formData.get("username"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { firstName, lastName, username } = parsed.data;

  const clash = await prisma.user.findFirst({
    where: { username, NOT: { id: user.id } },
    select: { id: true },
  });
  if (clash) {
    return { fieldErrors: { username: "That username is taken." } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName: lastName ?? null,
      username,
      name: [firstName, lastName].filter(Boolean).join(" "),
    },
  });

  await logAudit({
    actorId: user.id,
    action: "Updated profile information",
    actionCode: "account.profile.updated",
    method: "POST",
    statusCode: 200,
    targetUserId: user.id,
  });

  revalidatePath("/account/preferences");
  return { ok: true };
}

export async function requestAccountDeletion(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  // Mirrors changePassword: an OAuth-only account has no password to check.
  if (row?.passwordHash) {
    const current = String(formData.get("currentPassword") ?? "");
    const ok = await verifyPassword(current, row.passwordHash);
    if (!ok) {
      return { fieldErrors: { currentPassword: "Incorrect password." } };
    }
  }

  // Revoked immediately, including the current session — unlike a password
  // change, requesting deletion is meant to sign the user out on the spot.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: new Date() },
    }),
    prisma.deviceSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await logAudit({
    actorId: user.id,
    action: "Requested account deletion",
    actionCode: "account.deletion.requested",
    method: "POST",
    statusCode: 202,
    targetUserId: user.id,
  });

  revalidatePath("/account/preferences");
  redirect("/signin");
}

export async function cancelAccountDeletion(): Promise<ActionState> {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { deletionRequestedAt: null },
  });

  await logAudit({
    actorId: user.id,
    action: "Cancelled account deletion request",
    actionCode: "account.deletion.cancelled",
    method: "POST",
    statusCode: 200,
    targetUserId: user.id,
  });

  revalidatePath("/account/preferences");
  return { ok: true };
}
