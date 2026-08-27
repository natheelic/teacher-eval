"use client";

import { useTransition } from "react";
import { linkProvider, unlinkProvider } from "@/lib/actions/connections";

export function ConnectionButton({
  provider,
  connected,
  canDisconnect,
}: {
  provider: string;
  connected: boolean;
  canDisconnect: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!connected) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await linkProvider(provider); })}
        className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-border-strong bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-hover disabled:opacity-50"
      >
        {pending ? "Connecting..." : "Connect"}
      </button>
    );
  }

  return (
    <button
      type="button"
      // Disconnecting the only remaining sign-in method would lock the account.
      disabled={pending || !canDisconnect}
      title={
        canDisconnect ? undefined : "Set a password before disconnecting this."
      }
      onClick={() => startTransition(async () => { await unlinkProvider(provider); })}
      className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-border-strong bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Disconnecting..." : "Disconnect"}
    </button>
  );
}
