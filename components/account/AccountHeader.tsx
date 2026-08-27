import Link from "next/link";
import { Book } from "lucide-react";
import { AppLogo } from "../dashboard/AppLogo";
import { AccountMenu } from "./AccountMenu";
import { SearchTrigger } from "../search/SearchTrigger";
import { MobileMenuButton } from "../layout/MobileMenuButton";
import { FeedbackDialog } from "../dashboard/FeedbackDialog";
import { requireUser } from "@/lib/auth/require-session";
import { getPreferences } from "@/lib/queries/account";
import { getAppSettings } from "@/lib/queries/settings";

export async function AccountHeader() {
  const [user, preferences, { logoUrl }] = await Promise.all([
    requireUser(),
    getPreferences(),
    getAppSettings(),
  ]);

  return (
    <header className="flex h-12 items-center border-b border-black/8">
      <div className="flex min-w-0 flex-1 h-[47px] items-center justify-between gap-2 pl-2 pr-3 sm:pl-4">
        <div className="flex min-w-0 items-center gap-2">
          <MobileMenuButton />
          <Link href="/dashboard" className="hidden shrink-0 items-center justify-center sm:flex">
            <AppLogo className="h-[18px] w-auto" src={logoUrl} />
          </Link>
          <span className="truncate text-[13px] font-medium text-[#030303]">Account</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <FeedbackDialog />
          <div className="flex items-center gap-2">
            <SearchTrigger />
            <Link
              href="/docs"
              className="hidden size-8 items-center justify-center rounded-full border border-black/15 hover:bg-black/4 sm:flex"
            >
              <Book className="size-4 text-[#464646]" />
            </Link>
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
