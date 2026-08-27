import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-session";

export type FeedbackView = {
  id: string;
  message: string;
  /** Submitter's name/email, or "Deleted user" — Feedback.userId is
   * SetNull'd on account deletion, and every submission requires a signed-in
   * user, so null here always means "deleted since," never "anonymous." */
  submittedBy: string;
  createdAt: string;
};

const FEEDBACK_LIMIT = 100;

/**
 * Simple, unpaginated list (ROADMAP 6.2) — capped rather than paginated,
 * same tradeoff the audit-log CSV export makes for its own row cap. Revisit
 * with real pagination if feedback volume ever approaches the limit.
 */
export const getFeedbackList = cache(async (): Promise<FeedbackView[]> => {
  await requireAdmin();

  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: FEEDBACK_LIMIT,
    select: {
      id: true,
      message: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    message: row.message,
    submittedBy: row.user
      ? row.user.name?.trim() || row.user.email
      : "Deleted user",
    createdAt: row.createdAt.toISOString(),
  }));
});
