import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { appName as fallbackAppName } from "@/lib/app-config";

export type AppSettingsView = {
  logoUrl: string | null;
  /** Already resolved against the NEXT_PUBLIC_APP_NAME fallback — never null. */
  appName: string;
};

const SETTINGS_ID = "singleton";

/**
 * Public, unauthenticated read — the logo and product name render on the
 * landing page and the sign-in/sign-up layout, neither of which has a session.
 * Cached per render the same way getCurrentUser() is, since every page
 * composing its own chrome calls this independently.
 *
 * ⚠️ Because this read is unauthenticated and its result reaches anonymous
 * visitors, the `select` below must stay explicit. AppSettings also holds
 * `smtpPassEncrypted`; widening this select — or letting it become
 * `select: undefined`, which returns every column — would publish that secret.
 * SMTP config is resolved separately in lib/email-config.ts.
 */
export const getAppSettings = cache(async (): Promise<AppSettingsView> => {
  const row = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { logoUrl: true, appName: true },
  });
  return {
    logoUrl: row?.logoUrl ?? null,
    // Resolved here so no call site ever handles the null. A blank saved name
    // falls back too, rather than rendering an empty header.
    appName: row?.appName?.trim() || fallbackAppName,
  };
});
