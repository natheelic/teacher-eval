"use client";

import { useState, useTransition } from "react";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
} from "@/lib/actions/profile";

export function AccountDeletionButton({ requested }: { requested: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (requested) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await cancelAccountDeletion(); })}
        className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4 disabled:opacity-50"
      >
        {pending ? "Cancelling..." : "Cancel deletion request"}
      </button>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await requestAccountDeletion();
              setConfirming(false);
            })
          }
          className="flex h-[26px] items-center justify-center rounded-md border border-[#ab413e]/40 bg-[#ab413e]/10 px-2.5 py-1 text-xs font-medium text-[#ab413e] hover:brightness-95 disabled:opacity-50"
        >
          {pending ? "Requesting..." : "Yes, request deletion"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex h-[26px] items-center justify-center rounded-md border border-[#ab413e]/30 bg-[#fff0ee] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95"
    >
      Request to delete account
    </button>
  );
}
