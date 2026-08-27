"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth/require-session";
import { logAudit } from "@/lib/audit";

export type AnnouncementActionState = {
  error?: string;
  ok?: boolean;
};

const messageSchema = z.string().trim().min(1, "Enter a message").max(500);

/** The announcement appears in Header/AccountHeader across nearly every
 * signed-in route, so a change is invalidated at the root layout. */
function revalidateEverywhere() {
  revalidatePath("/", "layout");
}

/**
 * Creates the first announcement, or edits the currently active one in
 * place — collapses ROADMAP 6.3's "create" and "edit" into one action and
 * one audit action code, the same way changePassword() covers both "set"
 * and "change" under `account.password.changed` and varies only its
 * human-readable action text.
 */
export async function saveAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const user = await requireAdmin();

  const parsed = messageSchema.safeParse(formData.get("message"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]!.message };
  }

  const active = await prisma.announcement.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  if (active) {
    await prisma.$transaction([
      prisma.announcement.update({
        where: { id: active.id },
        data: { message: parsed.data },
      }),
      prisma.user.updateMany({
        where: { dismissedAnnouncementId: active.id },
        data: { dismissedAnnouncementId: null },
      }),
    ]);
  } else {
    await prisma.announcement.create({
      data: { message: parsed.data, active: true },
    });
  }

  await logAudit({
    actorId: user.id,
    action: active ? "Updated the announcement" : "Created an announcement",
    actionCode: "announcement.saved",
    method: "POST",
    statusCode: active ? 200 : 201,
    targetLabel: "Announcement",
  });

  revalidateEverywhere();
  return { ok: true };
}

export async function deactivateAnnouncement(): Promise<AnnouncementActionState> {
  const user = await requireAdmin();

  const { count } = await prisma.announcement.updateMany({
    where: { active: true },
    data: { active: false },
  });
  if (count === 0) return { ok: true };

  await logAudit({
    actorId: user.id,
    action: "Deactivated the announcement",
    actionCode: "announcement.deactivated",
    method: "POST",
    statusCode: 200,
    targetLabel: "Announcement",
  });

  revalidateEverywhere();
  return { ok: true };
}

/**
 * Any signed-in user may dismiss the announcement currently shown to them —
 * unlike the two actions above, not admin-gated. Not audited: dismissing an
 * announcement isn't security-relevant, the same reasoning submitFeedback()
 * already uses to skip logAudit.
 *
 * The caller-supplied id is only used to no-op a stale dismiss (e.g. a
 * banner the client had already rendered before someone else published a
 * new one) — the id actually persisted is always resolved from the active
 * row server-side, never trusted from the client.
 */
export async function dismissAnnouncement(
  announcementId: string,
): Promise<void> {
  const user = await requireUser();

  const active = await prisma.announcement.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  if (!active || active.id !== announcementId) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { dismissedAnnouncementId: active.id },
  });
}
