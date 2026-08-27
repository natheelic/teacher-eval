import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type AppSettingsView = {
  logoUrl: string | null;
};

const SETTINGS_ID = "singleton";

/**
 * Public, unauthenticated read — the logo renders on the landing page and
 * the sign-in/sign-up layout, neither of which has a session. Cached per
 * render the same way getCurrentUser() is, since every page composing its
 * own chrome calls this independently.
 */
export const getAppSettings = cache(async (): Promise<AppSettingsView> => {
  const row = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { logoUrl: true },
  });
  return { logoUrl: row?.logoUrl ?? null };
});
