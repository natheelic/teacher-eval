"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Clock, RefreshCw } from "lucide-react";

const RANGES = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
] as const;

/**
 * Filters live in the URL and re-render the server component, so the table
 * itself never has to become a client component.
 */
export function AuditLogFilters({
  range,
  projectId,
  projects,
  total,
}: {
  range: string;
  projectId: string | null;
  projects: { id: string; name: string }[];
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // Paging is relative to the current filter, so drop the cursor on change.
    next.delete("cursor");
    startTransition(() => {
      router.replace(`/account/audit-logs?${next.toString()}`);
    });
  }

  const selectClass =
    "h-[26px] rounded-md border border-black/15 bg-[#fdfdfd] px-2 text-xs font-medium text-[#030303] outline-none hover:bg-black/4 disabled:opacity-50";

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="pr-2 text-xs font-medium text-[#464646]">Filter by</span>

        <select
          aria-label="Filter by project"
          value={projectId ?? ""}
          disabled={pending}
          onChange={(e) => setParam("project", e.target.value || null)}
          className={`${selectClass} border-dashed`}
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5 text-[#464646]" />
          <select
            aria-label="Filter by time range"
            value={range}
            disabled={pending}
            onChange={(e) => setParam("range", e.target.value)}
            className={selectClass}
          >
            {RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </span>

        <span className="mx-2 h-5 w-px bg-black/15" />
        <span className="text-xs font-medium text-[#464646]">
          Viewing {total} {total === 1 ? "log" : "logs"} in total
        </span>
      </div>

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
  );
}
