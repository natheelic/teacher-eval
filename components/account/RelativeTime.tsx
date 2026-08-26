"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime, relativeTime } from "@/lib/format";

// Never changes, so the store never notifies: getServerSnapshot returns false
// during SSR and the hydration render, getSnapshot returns true afterwards.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Renders an absolute timestamp on the server and during hydration, then
 * upgrades to relative time on the client.
 *
 * Computing "2 minutes ago" from `new Date()` during SSR and again on the
 * client yields different strings and a hydration mismatch, so the relative
 * form only ever appears after hydration.
 */
export function RelativeTime({ iso }: { iso: string }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const absolute = formatDateTime(iso);

  return (
    <time dateTime={iso} title={absolute}>
      {hydrated ? relativeTime(iso) : absolute}
    </time>
  );
}
