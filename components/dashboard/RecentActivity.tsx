import Link from "next/link";
import { RelativeTime } from "../account/RelativeTime";
import { getAuditLogs } from "@/lib/queries/audit";

/** Uses the same scope enforcement as the full audit log: a member never sees
 * more than their own rows here, regardless of role. */
export async function RecentActivity({ canSeeAll }: { canSeeAll: boolean }) {
  const { rows } = await getAuditLogs({
    range: "7d",
    scope: canSeeAll ? "all" : "mine",
    actionCode: null,
    target: "",
    cursor: null,
  });
  const recent = rows.slice(0, 5);

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">
          Recent activity
        </h2>
        <Link
          href="/account/audit-logs"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-[13px] font-medium text-foreground-muted">
          No activity in the last 7 days.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {recent.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] text-foreground-secondary">
                  {row.action}
                </span>
                {canSeeAll && row.actor && (
                  <span className="truncate text-xs text-foreground-muted">
                    {row.actor}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-foreground-muted">
                <RelativeTime iso={row.createdAt} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
