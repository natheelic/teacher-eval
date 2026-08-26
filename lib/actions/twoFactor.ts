"use server";

import { revalidatePath } from "next/cache";
import { toDataURL } from "qrcode";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import { verifyPassword } from "@/lib/auth/password";
import {
  buildOtpAuthUrl,
  decryptPendingSecret,
  encryptPendingSecret,
  generateTotpSecret,
  verifyTotpCode,
} from "@/lib/auth/totp";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "@/lib/actions/profile";

export type TwoFactorSetupState = ActionState & {
  pending?: { qrDataUrl: string; manualKey: string; token: string };
};

/** Generates a fresh secret and shows it — writes nothing to the database. */
export async function startTwoFactorEnrollment(): Promise<TwoFactorSetupState> {
  const user = await requireUser();

  const secret = generateTotpSecret();
  const otpauth = buildOtpAuthUrl(secret, user.email);
  const qrDataUrl = await toDataURL(otpauth, { margin: 1, width: 220 });
  const manualKey = secret.match(/.{1,4}/g)?.join(" ") ?? secret;
  const token = encryptPendingSecret(secret, user.id);

  return { pending: { qrDataUrl, manualKey, token } };
}

const confirmSchema = z.object({
  token: z.string().min(1),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/** Only writes twoFactorSecret/twoFactorEnabled once the submitted code verifies. */
export async function confirmTwoFactorEnrollment(
  _prev: TwoFactorSetupState,
  formData: FormData,
): Promise<TwoFactorSetupState> {
  const user = await requireUser();

  const parsed = confirmSchema.safeParse({
    token: formData.get("token"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "code")] ??= issue.message;
    }
    return { fieldErrors };
  }

  const secret = decryptPendingSecret(parsed.data.token, user.id);
  if (!secret) {
    return { error: "That setup session expired. Start again." };
  }
  if (!(await verifyTotpCode(secret, parsed.data.code))) {
    return { fieldErrors: { code: "Incorrect code. Try again." } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: true },
  });

  await logAudit({
    actorId: user.id,
    targetUserId: user.id,
    action: "Enabled two-factor authentication",
    actionCode: "account.2fa.enabled",
    method: "POST",
    statusCode: 200,
  });

  revalidatePath("/account/security");
  return { ok: true };
}

const disableSchema = z.object({
  currentPassword: z.string().optional(),
});

export async function disableTwoFactor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = disableSchema.safeParse({
    currentPassword: formData.get("currentPassword") || undefined,
  });
  if (!parsed.success) return { error: "Something went wrong." };

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  // Mirrors changePassword: only ask for a password when one exists.
  if (row?.passwordHash) {
    const current = parsed.data.currentPassword ?? "";
    const ok = await verifyPassword(current, row.passwordHash);
    if (!ok) {
      return { fieldErrors: { currentPassword: "Incorrect password." } };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  await logAudit({
    actorId: user.id,
    targetUserId: user.id,
    action: "Disabled two-factor authentication",
    actionCode: "account.2fa.disabled",
    method: "POST",
    statusCode: 200,
  });

  revalidatePath("/account/security");
  return { ok: true };
}
