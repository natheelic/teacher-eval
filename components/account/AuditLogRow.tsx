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
  const border = showBorder ? "border-b border-black/8" : "";

  return (
    <>
      <tr
        className={`bg-white ${hasDetail ? "cursor-pointer hover:bg-black/[0.015]" : ""}`}
        onClick={hasDetail ? () => setOpen((o) => !o) : undefined}
      >
        <td className={`${border} px-4 py-3 align-top`}>
          <div className="flex flex-wrap items-center gap-2">
            <ChevronRight
              className={`size-3.5 shrink-0 text-[#a0a0a0] transition-transform ${
                open ? "rotate-90" : ""
              } ${hasDetail ? "" : "invisible"}`}
            />
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
            <span className="text-[13px] text-[#6f6f6f]">{row.action}</span>
          </div>
        </td>
        <td className={`${border} px-4 py-3 align-top`}>
          <span className="text-[13px] font-medium text-[#464646]">
            {targetColumnLabel ?? "-"}
          </span>
        </td>
        <td className={`${border} px-4 py-3 align-top text-[13px] text-[#6f6f6f]`}>
          <RelativeTime iso={row.createdAt} />
        </td>
      </tr>

      {open && hasDetail && (
        <tr className="bg-black/[0.02]">
          <td colSpan={3} className={`${border} px-4 py-3`}>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs">
              {row.ipAddress && (
                <>
                  <dt className="font-medium text-[#696969]">IP address</dt>
                  <dd className="font-mono text-[#464646]">
                    {row.ipAddress}
                  </dd>
                </>
              )}
              {row.userAgent && (
                <>
                  <dt className="font-medium text-[#696969]">User agent</dt>
                  <dd className="break-all text-[#464646]">
                    {row.userAgent}
                  </dd>
                </>
              )}
              {row.metadata && (
                <>
                  <dt className="font-medium text-[#696969]">Metadata</dt>
                  <dd>
                    <pre className="whitespace-pre-wrap break-all font-mono text-[#464646]">
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
