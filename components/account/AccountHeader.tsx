import Link from "next/link";
import { Command, Book, Search } from "lucide-react";
import { SupabaseLogo } from "../dashboard/SupabaseLogo";

export function AccountHeader() {
  return (
    <header className="flex h-12 items-center border-b border-black/8">
      <div className="flex flex-1 h-[47px] items-center justify-between pl-4 pr-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center justify-center">
            <SupabaseLogo className="h-[18px] w-auto" />
          </Link>
          <span className="text-[13px] font-medium text-[#030303]">Account</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-[#464646] hover:bg-black/4">
            Feedback
          </button>
          <div className="flex items-center gap-2">
            <button className="flex h-[30px] w-[128px] items-center justify-between rounded-full border border-black/15 pl-2 pr-1 py-2 text-xs text-[#696969] hover:border-black/25">
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
          </div>
          <button className="flex size-8 items-center justify-center rounded-full border border-black/15 bg-[#fdfdfd] hover:bg-black/4">
            <span className="flex size-[30px] items-center justify-center rounded-md bg-[#030303] text-[13px] font-medium text-white">
              N
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
