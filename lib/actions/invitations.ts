"use server";

import { AuthError } from "next-auth";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/auth";
import { DEFAULT_SIGNED_IN_PATH } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { passwordSchema, hashPassword } from "@/lib/auth/password";
import { consumeInvitationToken } from "@/lib/auth/invitations";
import { logAudit } from "@/lib/audit";
import type { AuthFormState } from "@/lib/actions/auth";

const acceptSchema = z.object({
  token: z.string().trim().min(1),
  password: passwordSchema,
});

/**
 * Consumes an invitation token, activates the matching INVITED account with
 * a self-chosen password, and signs the new user in immediately — mirrors
 * signUpAction's shape (create, then signIn(), let the redirect throw).
 */
export async function acceptInvitation(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = acceptSchema.safeParse({
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

  const email = await consumeInvitationToken(parsed.data.token);
  if (!email) {
    return {
      error:
        "This invitation link is invalid or has expired. Ask an admin to resend it.",
    };
  }

  const user = await prisma.user.findFirst({
    where: { email, status: "INVITED", deletedAt: null },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    return {
      error:
        "This invitation has already been used, or the account no longer exists.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordUpdatedAt: new Date(), status: "ACTIVE" },
  });

  await logAudit({
    actorId: user.id,
    targetUserId: user.id,
    action: "Accepted the invitation",
    actionCode: "user.invitation.accepted",
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
      return { error: "Account activated, but sign-in failed. Try signing in." };
    }
    throw error;
  }

  return {};
}
