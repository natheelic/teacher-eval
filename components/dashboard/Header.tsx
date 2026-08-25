import Link from "next/link";
import {
  ChevronDown,
  Command,
  MoreHorizontal,
  Bell,
  Book,
  Search,
} from "lucide-react";
import { AppLogo } from "./AppLogo";

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
    <div className="flex items-center">
      <div className="flex items-center pr-2 text-[#464646]">
        <MoreHorizontal className="size-4 opacity-0" />
      </div>
      <div className="flex items-center">
        <a
          href="#"
          className="flex items-center gap-2 hover:opacity-80"
        >
          <span className="text-[13px] font-medium text-[#030303] whitespace-nowrap">
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
      <div className="flex flex-1 h-[47px] items-center justify-between pl-4 pr-3">
        <div className="flex items-center">
          <a href="#" className="flex items-center justify-center">
            <AppLogo className="h-[18px] w-auto" />
          </a>

          <div className="flex items-center pl-2 gap-0">
            <Crumb label="Nathee Srina's projects" badge="Free" />
            <Crumb label="oas-eleccom" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-[#464646] hover:bg-black/4">
            Feedback
          </button>
          <div className="flex items-center gap-2 w-72">
            <button className="flex h-[30px] flex-1 items-center justify-between rounded-full border border-black/15 pl-2 pr-1 py-2 text-xs text-[#696969] hover:border-black/25">
              <span className="flex items-center gap-1.5">
                <Search className="size-4" />
                Search...
              </span>
              <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] tracking-[-0.275px] text-[#696969]">
                <Command className="size-3" />K
              </span>
            </button>
            <button className="flex size-8 items-center justify-center rounded-full border border-black/15 hover:bg-black/4">
              <Book className="size-4 text-[#464646]" />
            </button>
            <button className="flex size-8 items-center justify-center rounded-full border border-black/15 hover:bg-black/4">
              <Bell className="size-4 text-[#464646]" />
            </button>
          </div>
          <Link
            href="/account/preferences"
            className="flex size-8 items-center justify-center rounded-full border border-black/15 bg-[#fdfdfd] hover:bg-black/4"
          >
            <span className="flex size-[30px] items-center justify-center rounded-md bg-[#030303] text-[13px] font-medium text-white">
              N
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
