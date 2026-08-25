"use client";

import { Menu } from "lucide-react";
import { useMobileNav } from "./MobileNavProvider";

export function MobileMenuButton() {
  const { setOpen } = useMobileNav();

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open navigation"
      className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-black/4 lg:hidden"
    >
      <Menu className="size-[18px] text-[#464646]" />
    </button>
  );
}
