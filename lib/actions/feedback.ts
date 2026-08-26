"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import type { ActionState } from "@/lib/actions/profile";

const feedbackSchema = z.object({
  message: z.string().trim().min(1, "Enter your feedback").max(2000),
});

/**
 * No audit log entry — the row itself is the record, and this isn't a
 * security-relevant action like the ones that use logAudit elsewhere.
 */
export async function submitFeedback(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = feedbackSchema.safeParse({
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { fieldErrors: { message: parsed.error.issues[0]!.message } };
  }

  await prisma.feedback.create({
    data: { userId: user.id, message: parsed.data.message },
  });

  return { ok: true };
}
