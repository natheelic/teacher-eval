import Link from "next/link";
import { Bell, Book } from "lucide-react";
import { AppLogo } from "./AppLogo";
import { AccountMenu } from "../account/AccountMenu";
import { SearchTrigger } from "../search/SearchTrigger";
import { MobileMenuButton } from "../layout/MobileMenuButton";
import { requireUser } from "@/lib/auth/require-session";
import { getPreferences } from "@/lib/queries/account";
import { ROLE_LABELS } from "@/lib/permissions";
import { appName } from "@/lib/app-config";

// Used by several pages, so it reads the session itself rather than having
// every page thread the same props through. Both calls are cached per render.
export async function Header() {
  const [user, preferences] = await Promise.all([
    requireUser(),
    getPreferences(),
  ]);

  return (
    <header className="flex h-12 items-center border-b border-black/8">
      <div className="flex min-w-0 flex-1 h-[47px] items-center justify-between gap-2 pl-2 pr-3 sm:pl-4">
        <div className="flex min-w-0 items-center gap-2">
          <MobileMenuButton />
          <Link
            href="/users"
            className="hidden shrink-0 items-center justify-center lg:flex"
          >
            <AppLogo className="h-[18px] w-auto" />
          </Link>

          <div className="flex min-w-0 items-center gap-2 pl-1 lg:pl-2">
            <span className="truncate text-[13px] font-medium text-[#030303]">
              {appName}
            </span>
            <span className="flex shrink-0 items-center rounded-full border border-black/15 bg-white px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-[#464646]">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button className="hidden h-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-[#464646] hover:bg-black/4 lg:flex">
            Feedback
          </button>
          <div className="flex items-center gap-2 lg:w-72">
            <SearchTrigger />
            <button className="hidden size-8 items-center justify-center rounded-full border border-black/15 hover:bg-black/4 lg:flex">
              <Book className="size-4 text-[#464646]" />
            </button>
            <button className="flex size-8 items-center justify-center rounded-full border border-black/15 hover:bg-black/4">
              <Bell className="size-4 text-[#464646]" />
            </button>
          </div>
          <AccountMenu
            initial={(user.name?.trim() || user.email)[0]!.toUpperCase()}
            theme={preferences.theme}
          />
        </div>
      </div>
    </header>
  );
}
