import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type AnnouncementView = {
  id: string;
  message: string;
};

/** The single announcement an admin has published, if any — independent of
 * whether any particular viewer has dismissed it. Used by the admin panel. */
export const getActiveAnnouncement = cache(
  async (): Promise<AnnouncementView | null> => {
    return prisma.announcement.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, message: true },
    });
  },
);

/**
 * What Header/AccountHeader actually render: null once the given user has
 * already dismissed the currently active announcement, or there isn't one.
 */
export const getVisibleAnnouncement = cache(
  async (userId: string): Promise<AnnouncementView | null> => {
    const [active, user] = await Promise.all([
      getActiveAnnouncement(),
      prisma.user.findUnique({
        where: { id: userId },
        select: { dismissedAnnouncementId: true },
      }),
    ]);

    if (!active || user?.dismissedAnnouncementId === active.id) return null;
    return active;
  },
);
