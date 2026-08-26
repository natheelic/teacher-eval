"use server";

import { AuthError } from "next-auth";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/auth";
import { DEFAULT_SIGNED_IN_PATH } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { passwordSchema, hashPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/auth/password-reset";
import { consumeVerificationToken } from "@/lib/auth/verification-tokens";
import { emailEnabled } from "@/lib/env";
import { logAudit } from "@/lib/audit";
import type { AuthFormState } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/profile";

const requestSchema = z.object({ email: z.email() });

/**
 * Always returns the same `ok: true` regardless of whether the email
 * matches an account — this is the one flow in the app worth protecting
 * against enumeration, since (unlike sign-up's "already in use" check) it's
 * the natural target for probing which addresses have accounts. The caller
 * renders a fixed generic confirmation, never text that could vary by
 * whether a match was found. Whether email is configured at all is safe to
 * reveal — that's operational state, not account data — so that check runs
 * first and can fail loudly.
 */
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = requestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: { email: "Enter a valid email address" } };
  }

  if (!emailEnabled) {
    return { error: "Email isn't configured — ask an admin for a password reset." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email, status: "ACTIVE", deletedAt: null },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    await sendPasswordResetEmail(user.email, user.name?.trim() || user.email);
    await logAudit({
      actorId: user.id,
      targetUserId: user.id,
      action: "Requested a password reset",
      actionCode: "account.password.reset_requested",
      method: "POST",
      statusCode: 200,
    });
  }

  return { ok: true };
}

const resetSchema = z.object({
  token: z.string().trim().min(1),
  password: passwordSchema,
});

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { fieldErrors };
  }

  const email = await consumeVerificationToken(parsed.data.token);
  if (!email) {
    return {
      error:
        "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const user = await prisma.user.findFirst({
    where: { email, status: "ACTIVE", deletedAt: null },
    select: { id: true, email: true },
  });
  if (!user) {
    return {
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    }),
    // No "current session" to exempt here, unlike a signed-in password
    // change — the requester isn't authenticated yet, so every session is
    // revoked, same as an admin-initiated reset.
    prisma.deviceSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await logAudit({
    actorId: user.id,
    targetUserId: user.id,
    action: "Reset password via emailed link",
    actionCode: "account.password.reset_completed",
    method: "POST",
    statusCode: 200,
  });

  try {
    await signIn("credentials", {
      email: user.email,
      password: parsed.data.password,
      redirectTo: DEFAULT_SIGNED_IN_PATH,
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return { error: "Password reset, but sign-in failed. Try signing in." };
    }
    throw error;
  }

  return {};
}
