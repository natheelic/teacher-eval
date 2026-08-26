import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { AuditLogFilters } from "./AuditLogFilters";
import { RelativeTime } from "./RelativeTime";
import {
  getAuditLogs,
  parseAuditFilters,
  type AuditRange,
} from "@/lib/queries/audit";

export type AuditLogsTableProps = {
  searchParams: {
    range?: string | string[];
    project?: string | string[];
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
  const { rows, total, nextCursor, projects } = await getAuditLogs(filters);

  return (
    <div className="flex w-full flex-col items-start">
      <AuditLogFilters
        range={filters.range as AuditRange}
        projectId={filters.projectId}
        projects={projects}
        total={total}
      />

      <div className="w-full overflow-x-auto rounded-md border border-black/8">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-black/[0.03]">
              <th className="border-b border-black/8 px-4 py-3 text-[13px] font-medium text-[#464646]">
                Action
              </th>
              <th className="border-b border-black/8 px-4 py-3 text-[13px] font-medium text-[#464646]">
                Target
              </th>
              <th className="border-b border-black/8 px-4 py-3 text-[13px] font-medium text-[#464646]">
                <span className="inline-flex items-center gap-2">
                  Date
                  <ArrowDown className="size-3.5" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="bg-white">
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-[13px] font-medium text-[#696969]"
                >
                  No activity in this period.
                </td>
              </tr>
            )}
            {rows.map((row, i) => {
              const cellBorder =
                i === rows.length - 1 ? "" : "border-b border-black/8";
              return (
                <tr key={row.id} className="bg-white">
                  <td className={`${cellBorder} px-4 py-3 align-top`}>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.statusCode !== null && (
                        <span className="flex items-center rounded border border-black/8 bg-black/[0.03] px-1 font-mono text-xs text-[#6f6f6f]">
                          {row.statusCode}
                        </span>
                      )}
                      {row.method && (
                        <span className="font-mono text-xs text-[#464646]">
                          {row.method}
                        </span>
                      )}
                      <span className="text-[13px] text-[#6f6f6f]">
                        {row.action}
                      </span>
                    </div>
                  </td>
                  <td className={`${cellBorder} px-4 py-3 align-top`}>
                    {row.target ? (
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-[#464646]">
                          {row.target.label}
                        </span>
                        {row.target.ref && (
                          <span className="text-xs font-medium text-[#464646]">
                            Ref: {row.target.ref}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[13px] font-medium text-[#464646]">
                        -
                      </span>
                    )}
                  </td>
                  <td
                    className={`${cellBorder} px-4 py-3 align-top text-[13px] text-[#6f6f6f]`}
                  >
                    <RelativeTime iso={row.createdAt} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="flex w-full justify-center pt-4">
          <Link
            href={buildHref({ ...searchParams, cursor: nextCursor })}
            className="flex h-[26px] items-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 text-xs font-medium text-[#030303] hover:bg-black/4"
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
