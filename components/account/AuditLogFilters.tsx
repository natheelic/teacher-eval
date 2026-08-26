"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Clock, RefreshCw, Search } from "lucide-react";
import { ACTION_CODES } from "@/lib/action-codes";

const RANGES = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
] as const;

/** "user.role.changed" -> "User role changed" — no manual label per code to keep in sync. */
function humanizeActionCode(code: string): string {
  const spaced = code.replace(/[._]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const controlClass =
  "h-[26px] rounded-md border border-black/15 bg-[#fdfdfd] px-2 text-xs font-medium text-[#030303] outline-none hover:bg-black/4 disabled:opacity-50";

/**
 * Filters live in the URL and re-render the server component, so the table
 * itself never has to become a client component.
 */
export function AuditLogFilters({
  range,
  scope,
  actionCode,
  target,
  canSeeAll,
  total,
}: {
  range: string;
  scope: string;
  actionCode: string | null;
  target: string;
  canSeeAll: boolean;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(next: URLSearchParams) {
    // Paging is relative to the current filter, so drop the cursor on change.
    next.delete("cursor");
    startTransition(() => {
      router.replace(`/account/audit-logs?${next.toString()}`);
    });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    apply(next);
  }

  const hasFilters = Boolean(actionCode || target);

  return (
    <form
      className="flex w-full flex-wrap items-center justify-between gap-2 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = String(
          new FormData(e.currentTarget).get("target") ?? "",
        ).trim();
        setParam("target", value || null);
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="pr-2 text-xs font-medium text-[#464646]">
          Filter by
        </span>

        {/* Only offered to managers and admins; the server enforces it too. */}
        {canSeeAll && (
          <select
            aria-label="Filter by scope"
            value={scope}
            disabled={pending}
            onChange={(e) => setParam("scope", e.target.value)}
            className={controlClass}
          >
            <option value="mine">My activity</option>
            <option value="all">Everyone</option>
          </select>
        )}

        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5 text-[#464646]" />
          <select
            aria-label="Filter by time range"
            value={range}
            disabled={pending}
            onChange={(e) => setParam("range", e.target.value)}
            className={controlClass}
          >
            {RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </span>

        <select
          aria-label="Filter by action"
          value={actionCode ?? ""}
          disabled={pending}
          onChange={(e) => setParam("actionCode", e.target.value || null)}
          className={controlClass}
        >
          <option value="">All actions</option>
          {ACTION_CODES.map((code) => (
            <option key={code} value={code}>
              {humanizeActionCode(code)}
            </option>
          ))}
        </select>

        <span className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-[#696969]" />
          {/* Uncontrolled with a key, same as UserFilters' search box: no
              mirrored state to keep in sync, and changing the URL remounts
              it with the new value. */}
          <input
            key={target}
            name="target"
            defaultValue={target}
            placeholder="Search target"
            aria-label="Filter by target"
            disabled={pending}
            className={`${controlClass} w-40 pl-7`}
          />
        </span>

        <span className="mx-2 h-5 w-px bg-black/15" />
        <span className="text-xs font-medium text-[#464646]">
          Viewing {total} {total === 1 ? "log" : "logs"} in total
        </span>
      </div>

      <div className="flex items-center gap-2">
        {hasFilters && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const next = new URLSearchParams(searchParams.toString());
              next.delete("actionCode");
              next.delete("target");
              apply(next);
            }}
            className={controlClass}
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => router.refresh())}
          className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4 disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    </form>
  );
}
