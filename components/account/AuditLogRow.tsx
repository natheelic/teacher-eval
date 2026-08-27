"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { RelativeTime } from "./RelativeTime";
import type { AuditLogView } from "@/lib/queries/audit";

export function AuditLogRow({
  row,
  targetColumnLabel,
  showBorder,
}: {
  row: AuditLogView;
  /** Actor or target, whichever the parent's column header/value picked. */
  targetColumnLabel: string | null;
  showBorder: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(row.ipAddress || row.userAgent || row.metadata);
  const border = showBorder ? "border-b border-border" : "";

  return (
    <>
      <tr
        className={`bg-surface ${hasDetail ? "cursor-pointer hover:bg-hover" : ""}`}
        onClick={hasDetail ? () => setOpen((o) => !o) : undefined}
      >
        <td className={`${border} px-4 py-3 align-top`}>
          <div className="flex flex-wrap items-center gap-2">
            <ChevronRight
              className={`size-3.5 shrink-0 text-foreground-disabled transition-transform ${
                open ? "rotate-90" : ""
              } ${hasDetail ? "" : "invisible"}`}
            />
            {row.statusCode !== null && (
              <span className="flex items-center rounded border border-border bg-hover px-1 font-mono text-xs text-foreground-muted">
                {row.statusCode}
              </span>
            )}
            {row.method && (
              <span className="font-mono text-xs text-foreground-secondary">
                {row.method}
              </span>
            )}
            <span className="text-[13px] text-foreground-muted">{row.action}</span>
          </div>
        </td>
        <td className={`${border} px-4 py-3 align-top`}>
          <span className="text-[13px] font-medium text-foreground-secondary">
            {targetColumnLabel ?? "-"}
          </span>
        </td>
        <td className={`${border} px-4 py-3 align-top text-[13px] text-foreground-muted`}>
          <RelativeTime iso={row.createdAt} />
        </td>
      </tr>

      {open && hasDetail && (
        <tr className="bg-hover">
          <td colSpan={3} className={`${border} px-4 py-3`}>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs">
              {row.ipAddress && (
                <>
                  <dt className="font-medium text-foreground-muted">IP address</dt>
                  <dd className="font-mono text-foreground-secondary">
                    {row.ipAddress}
                  </dd>
                </>
              )}
              {row.userAgent && (
                <>
                  <dt className="font-medium text-foreground-muted">User agent</dt>
                  <dd className="break-all text-foreground-secondary">
                    {row.userAgent}
                  </dd>
                </>
              )}
              {row.metadata && (
                <>
                  <dt className="font-medium text-foreground-muted">Metadata</dt>
                  <dd>
                    <pre className="whitespace-pre-wrap break-all font-mono text-foreground-secondary">
                      {JSON.stringify(row.metadata, null, 2)}
                    </pre>
                  </dd>
                </>
              )}
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}
