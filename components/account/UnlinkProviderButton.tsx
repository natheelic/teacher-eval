"use client";

import { useState, useTransition } from "react";
import { Unlink } from "lucide-react";
import { unlinkProvider } from "@/lib/actions/connections";

export function UnlinkProviderButton({
  provider,
  providerLabel,
}: {
  provider: string;
  providerLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await unlinkProvider(provider);
              setConfirming(false);
            })
          }
          className="flex h-[26px] items-center rounded-md border border-[#ab413e]/40 bg-[#ab413e]/5 px-2.5 text-xs font-medium text-[#ab413e] hover:bg-[#ab413e]/10 disabled:opacity-50"
        >
          {pending ? "Removing..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex h-[26px] items-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 text-xs font-medium text-[#030303] hover:bg-black/4"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Disconnect ${providerLabel}`}
      className="flex size-7 items-center justify-center rounded-md hover:bg-black/4"
    >
      <Unlink className="size-3.5 text-[#464646]" />
    </button>
  );
}
