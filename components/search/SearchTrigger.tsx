"use client";

import { Command, Search } from "lucide-react";
import { useSearch } from "./SearchProvider";

export function SearchTrigger({ className }: { className?: string }) {
  const { setOpen } = useSearch();

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Search"
      className={
        className ??
        "flex size-8 items-center justify-center rounded-full border border-black/15 hover:bg-black/4 lg:h-[30px] lg:w-auto lg:flex-1 lg:justify-between lg:pl-2 lg:pr-1 lg:py-2 lg:hover:border-black/25 lg:hover:bg-transparent"
      }
    >
      <span className="flex items-center gap-1.5">
        <Search className="size-4" />
        <span className="hidden lg:inline">Search...</span>
      </span>
      <span className="hidden items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] tracking-[-0.275px] text-[#696969] lg:flex">
        <Command className="size-3" />K
      </span>
    </button>
  );
}
