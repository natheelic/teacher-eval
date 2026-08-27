"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { dismissAnnouncement } from "@/lib/actions/announcements";

/**
 * Rendered from Header/AccountHeader themselves (ROADMAP 6.3), not threaded
 * into each page individually — the same lesson the old NoticeBanner's
 * removal already drew out (CLAUDE.md's dashboard component notes), so every
 * signed-in page picks it up automatically through the two shared headers.
 */
export function AnnouncementBanner({
  id,
  message,
}: {
  id: string;
  message: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  if (dismissed) return null;

  return (
    <div className="flex w-full items-start justify-between gap-3 border-b border-border bg-background px-4 py-2.5 sm:px-10">
      <p className="min-w-0 flex-1 text-[13px] font-medium text-foreground">
        {message}
      </p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          // Optimistic: hides immediately rather than waiting on the round
          // trip, same as RevealPanel's dismiss and other fire-and-forget
          // actions in this app (revokeDeviceSession, etc.).
          setDismissed(true);
          startTransition(async () => {
            await dismissAnnouncement(id);
          });
        }}
        className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-hover"
      >
        <X className="size-3.5 text-foreground-secondary" />
      </button>
    </div>
  );
}
