import type { NextRequest } from "next/server";
import { getAuditLogsForExport, parseAuditFilters } from "@/lib/queries/audit";
import { toCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";

/**
 * Not under app/api/ — this route needs the session-cookie protection the
 * proxy already gives every non-public page (PUBLIC_PREFIXES excludes it),
 * not the bearer-token model app/api/ routes use. getAuditLogsForExport()
 * still calls requireUser() itself for the real DB-backed check (revocation,
 * suspension) the proxy's JWT-only gate can't do, same as every page.
 */
export async function GET(request: NextRequest) {
  const filters = parseAuditFilters(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  const rows = await getAuditLogsForExport(filters);

  const csv = toCsv(
    [
      "Date",
      "Action code",
      "Action",
      "Method",
      "Status",
      "Actor",
      "Target",
      "IP address",
      "User agent",
    ],
    rows.map((row) => [
      formatDateTime(row.createdAt),
      row.actionCode,
      row.action,
      row.method ?? "",
      row.statusCode?.toString() ?? "",
      row.actor ?? "",
      row.target ?? "",
      row.ipAddress ?? "",
      row.userAgent ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
