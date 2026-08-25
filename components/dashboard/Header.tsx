import { ChevronDown, MoreHorizontal, Bell, Book } from "lucide-react";
import { AppLogo } from "./AppLogo";
import { AccountMenu } from "../account/AccountMenu";
import { SearchTrigger } from "../search/SearchTrigger";
import { MobileMenuButton } from "../layout/MobileMenuButton";

function Crumb({
  label,
  badge,
  badgeTone = "neutral",
}: {
  label: string;
  badge?: string;
  badgeTone?: "neutral" | "amber";
}) {
  return (
    <div className="flex min-w-0 items-center">
      <div className="hidden shrink-0 items-center pr-2 text-[#464646] sm:flex">
        <MoreHorizontal className="size-4 opacity-0" />
      </div>
      <div className="flex min-w-0 items-center">
        <a
          href="#"
          className="flex min-w-0 items-center gap-2 hover:opacity-80"
        >
          <span className="min-w-0 truncate text-[13px] font-medium text-[#030303]">
            {label}
          </span>
          <span className="flex items-center justify-center size-5 rounded-md border border-black/8 bg-white">
            <ChevronDown className="size-2.5 text-[#464646]" />
          </span>
          {badge && (
            <span
              className={`flex items-center rounded-full border px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] ${
                badgeTone === "amber"
                  ? "border-[#f3ba63] bg-[#ca8a10]/10 text-[#dc7b18]"
                  : "border-black/15 bg-white text-[#464646]"
              }`}
            >
              {badge}
            </span>
          )}
        </a>
        <button className="ml-1 flex h-[34px] w-7 items-center justify-center rounded-md hover:bg-black/4">
          <MoreHorizontal className="size-3.5 text-[#464646]" />
        </button>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="flex h-12 items-center border-b border-black/8">
      <div className="flex min-w-0 flex-1 h-[47px] items-center justify-between gap-2 pl-2 pr-3 sm:pl-4">
        <div className="flex min-w-0 items-center">
          <MobileMenuButton />
          <a href="#" className="hidden shrink-0 items-center justify-center lg:flex">
            <AppLogo className="h-[18px] w-auto" />
          </a>

          <div className="flex min-w-0 items-center pl-1 gap-0 lg:pl-2">
            <span className="hidden lg:contents">
              <Crumb label="Your Organization" badge="Free" />
            </span>
            <Crumb label="my-project" />
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
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
