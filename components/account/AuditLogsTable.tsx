import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { AuditLogFilters } from "./AuditLogFilters";
import { AuditLogRow } from "./AuditLogRow";
import { getAuditLogs, parseAuditFilters } from "@/lib/queries/audit";

export type AuditLogsTableProps = {
  searchParams: {
    range?: string | string[];
    scope?: string | string[];
    actionCode?: string | string[];
    target?: string | string[];
    cursor?: string | string[];
  };
};

/**
 * Stays a server component: the table can hold hundreds of rows, and shipping
 * them through a client boundary just to filter would be wasteful. Filters are
 * URL searchParams, which also makes them shareable and bookmarkable.
 */
export async function AuditLogsTable({ searchParams }: AuditLogsTableProps) {
  const filters = parseAuditFilters(searchParams);
  const { rows, total, nextCursor, canSeeAll } = await getAuditLogs(filters);

  return (
    <div className="flex w-full flex-col items-start">
      <AuditLogFilters
        range={filters.range}
        scope={filters.scope}
        actionCode={filters.actionCode}
        target={filters.target}
        canSeeAll={canSeeAll}
        total={total}
      />

      <div className="w-full overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-hover">
              <th className="border-b border-border px-4 py-3 text-[13px] font-medium text-foreground-secondary">
                Action
              </th>
              <th className="border-b border-border px-4 py-3 text-[13px] font-medium text-foreground-secondary">
                {canSeeAll && filters.scope === "all" ? "Actor" : "Target"}
              </th>
              <th className="border-b border-border px-4 py-3 text-[13px] font-medium text-foreground-secondary">
                <span className="inline-flex items-center gap-2">
                  Date
                  <ArrowDown className="size-3.5" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="bg-surface">
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-[13px] font-medium text-foreground-muted"
                >
                  No activity in this period.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <AuditLogRow
                key={row.id}
                row={row}
                targetColumnLabel={
                  canSeeAll && filters.scope === "all" ? row.actor : row.target
                }
                showBorder={i !== rows.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="flex w-full justify-center pt-4">
          <Link
            href={buildHref({ ...searchParams, cursor: nextCursor })}
            className="flex h-[26px] items-center rounded-md border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground hover:bg-hover"
          >
            Load older
          </Link>
        </div>
      )}
    </div>
  );
}

function buildHref(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) search.set(key, v);
  }
  const qs = search.toString();
  return qs ? `/account/audit-logs?${qs}` : "/account/audit-logs";
}
