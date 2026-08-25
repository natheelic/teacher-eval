"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function NoticeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 w-72 overflow-hidden rounded-md border border-black/8 bg-white shadow-lg">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(63,207,142,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,207,142,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "linear-gradient(to bottom, black, transparent 90%)",
        }}
      />
      <button
        onClick={() => setDismissed(true)}
        aria-label="Close banner"
        className="absolute right-4 top-4 flex size-6 items-center justify-center rounded hover:bg-black/4"
      >
        <X className="size-3.5 text-[#464646]" />
      </button>
      <div className="relative flex flex-col gap-4 p-6">
        <span className="inline-flex w-fit items-center rounded-full border border-black/15 bg-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.6px] text-[#464646]">
          Notice
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-[15px] font-medium text-[#030303]">
            We&rsquo;re updating our Terms of Service
          </p>
          <p className="text-sm text-[#464646]">
            Our Data Processing Addendum is now built into the terms.
          </p>
        </div>
        <button className="flex h-[26px] w-fit items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
          Learn more
        </button>
      </div>
    </div>
  );
}
