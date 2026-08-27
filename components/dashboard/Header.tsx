import Link from "next/link";
import { Book } from "lucide-react";
import { AppLogo } from "./AppLogo";
import { FeedbackDialog } from "./FeedbackDialog";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { AccountMenu } from "../account/AccountMenu";
import { SearchTrigger } from "../search/SearchTrigger";
import { MobileMenuButton } from "../layout/MobileMenuButton";
import { requireUser } from "@/lib/auth/require-session";
import { getPreferences } from "@/lib/queries/account";
import { getAppSettings } from "@/lib/queries/settings";
import { getVisibleAnnouncement } from "@/lib/queries/announcements";
import { ROLE_LABELS } from "@/lib/permissions";
import { appName } from "@/lib/app-config";

// Used by several pages, so it reads the session itself rather than having
// every page thread the same props through. All calls are cached per render.
export async function Header() {
  const [user, preferences, { logoUrl }] = await Promise.all([
    requireUser(),
    getPreferences(),
    getAppSettings(),
  ]);
  const announcement = await getVisibleAnnouncement(user.id);

  return (
    <>
      <header className="flex h-12 items-center border-b border-border">
        <div className="flex min-w-0 flex-1 h-[47px] items-center justify-between gap-2 pl-2 pr-3 sm:pl-4">
          <div className="flex min-w-0 items-center gap-2">
            <MobileMenuButton />
            <Link
              href="/dashboard"
              className="hidden shrink-0 items-center justify-center lg:flex"
            >
              <AppLogo className="h-[18px] w-auto" src={logoUrl} />
            </Link>

            <div className="flex min-w-0 items-center gap-2 pl-1 lg:pl-2">
              <span className="truncate text-[13px] font-medium text-foreground">
                {appName}
              </span>
              <span className="flex shrink-0 items-center rounded-full border border-border-strong bg-surface px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-foreground-secondary">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <FeedbackDialog />
            <div className="flex items-center gap-2 lg:w-72">
              <SearchTrigger />
              <Link
                href="/docs"
                className="hidden size-8 items-center justify-center rounded-full border border-border-strong hover:bg-hover lg:flex"
              >
                <Book className="size-4 text-foreground-secondary" />
              </Link>
            </div>
            <AccountMenu
              initial={(user.name?.trim() || user.email)[0]!.toUpperCase()}
              theme={preferences.theme}
            />
          </div>
        </div>
      </header>
      {announcement && (
        <AnnouncementBanner id={announcement.id} message={announcement.message} />
      )}
    </>
  );
}
