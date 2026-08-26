"use server";

import { requireUser } from "@/lib/auth/require-session";
import { sendVerificationEmail } from "@/lib/auth/email-verification";
import { emailEnabled } from "@/lib/env";
import type { ActionState } from "@/lib/actions/profile";

export async function resendVerificationEmail(): Promise<ActionState> {
  const user = await requireUser();

  if (user.emailVerified) return { ok: true };
  if (!emailEnabled) {
    return { error: "Email isn't configured — ask an admin to set it up." };
  }

  await sendVerificationEmail(user.email, user.name?.trim() || user.email);
  return { ok: true };
}
