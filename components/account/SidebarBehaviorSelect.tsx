"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { updateSidebarBehavior } from "@/lib/actions/preferences";

const OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "EXPAND_ON_HOVER", label: "Expand on hover" },
] as const;

export function SidebarBehaviorSelect({ value }: { value: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative w-full">
      <select
        aria-label="Sidebar behavior"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            await updateSidebarBehavior(next);
          });
        }}
        className="h-[34px] w-full appearance-none rounded-md border border-black/15 bg-transparent px-3 pr-8 text-[13px] font-medium text-[#030303] outline-none hover:bg-black/[0.02] focus:border-black/30 disabled:opacity-50"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#696969]" />
    </div>
  );
}
