import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { UserFilters } from "./UserFilters";
import { UserRowActions } from "./UserRowActions";
import { CreateUserDialog } from "./CreateUserDialog";
import { RelativeTime } from "../account/RelativeTime";
import { getUsers, parseUserFilters } from "@/lib/queries/users";
import { formatDate } from "@/lib/format";
import {
  ROLE_LABELS,
  assignableRolesFor,
  canActOnUser,
  canDeleteUsers,
} from "@/lib/permissions";
import type { Role, UserStatus } from "@/lib/generated/prisma/enums";
import { requireUserManager } from "@/lib/auth/require-session";

export type UsersTableProps = {
  searchParams: {
    q?: string | string[];
    role?: string | string[];
    status?: string | string[];
    cursor?: string | string[];
  };
};

const STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: "border-success bg-success/10 text-success-strong",
  INVITED: "border-pending bg-pending/10 text-pending-strong",
  SUSPENDED: "border-danger/40 bg-danger/10 text-danger",
};

/**
 * Distinct per role so the permission ladder (ADMIN > MANAGER > MEMBER >
 * VIEWER) reads at a glance — MANAGER and MEMBER used to share identical
 * styling, making them indistinguishable in the table.
 */
const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "border-foreground bg-foreground text-background",
  MANAGER: "border-success/40 bg-success/10 text-success-strong",
  MEMBER: "border-border-strong bg-surface text-foreground-secondary",
  VIEWER: "border-border bg-hover text-foreground-muted",
};

/**
 * Stays a server component: the row list can grow large, and shipping it
 * through a client boundary just to filter would be wasteful. Filters live in
 * the URL, so they are shareable and survive a refresh.
 */
export async function UsersTable({ searchParams }: UsersTableProps) {
  const viewer = await requireUserManager();
  const filters = parseUserFilters(searchParams);
  const { rows, total, nextCursor, stats } = await getUsers(filters);

  const assignable = assignableRolesFor(viewer.role);

  return (
    <div className="flex w-full flex-col items-start">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 pb-6">
        <div className="flex flex-wrap items-center gap-6">
          <Stat label="Total" value={stats.total} />
          <Stat label="Active" value={stats.active} />
          <Stat label="Suspended" value={stats.suspended} />
          <Stat label="Admins" value={stats.admins} />
        </div>
        <CreateUserDialog assignableRoles={assignable} />
      </div>

      <UserFilters
        query={filters.query}
        role={filters.role}
        status={filters.status}
        total={total}
      />

      <div className="w-full overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="bg-hover">
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last sign-in</Th>
              <Th>Created</Th>
              <th className="border-b border-border px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="bg-surface">
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-[13px] font-medium text-foreground-muted"
                >
                  No users match these filters.
                </td>
              </tr>
            )}
            {rows.map((row, i) => {
              const border =
                i === rows.length - 1 ? "" : "border-b border-border";
              const actionable = canActOnUser(viewer, row);

              return (
                <tr key={row.id} className="bg-surface">
                  <td className={`${border} px-4 py-3 align-middle`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-[#030303] text-[13px] font-medium text-white">
                        {row.initial}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-medium text-foreground">
                            {row.name?.trim() || row.username || "—"}
                          </span>
                          {row.isYou && (
                            <span className="flex shrink-0 items-center rounded-full border border-border-strong bg-surface px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-foreground-secondary">
                              You
                            </span>
                          )}
                        </span>
                        <span className="truncate text-[13px] font-medium text-foreground-muted">
                          {row.email}
                        </span>
                        {row.deletionDeadline && (
                          <span className="truncate text-[13px] font-medium text-danger">
                            Deletion requested · deletes{" "}
                            <RelativeTime iso={row.deletionDeadline} />
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`${border} px-4 py-3 align-middle`}>
                    <Badge className={ROLE_STYLES[row.role]}>
                      {ROLE_LABELS[row.role]}
                    </Badge>
                  </td>
                  <td className={`${border} px-4 py-3 align-middle`}>
                    <Badge className={STATUS_STYLES[row.status]}>
                      {row.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td
                    className={`${border} px-4 py-3 align-middle text-[13px] text-foreground-muted`}
                  >
                    {row.lastLoginAt ? (
                      <RelativeTime iso={row.lastLoginAt} />
                    ) : (
                      "Never"
                    )}
                  </td>
                  <td
                    className={`${border} px-4 py-3 align-middle text-[13px] text-foreground-muted`}
                  >
                    {formatDate(row.createdAt)}
                  </td>
                  <td className={`${border} px-4 py-3 text-right align-middle`}>
                    {actionable ? (
                      <UserRowActions
                        user={{
                          id: row.id,
                          label: row.name?.trim() || row.email,
                          role: row.role,
                          status: row.status,
                          suspended: row.status === "SUSPENDED",
                        }}
                        assignableRoles={assignable}
                        canDelete={canDeleteUsers(viewer.role)}
                      />
                    ) : row.isYou ? (
                      <button
                        type="button"
                        disabled
                        title="You can't manage your own account here — use Account settings instead."
                        aria-label="No actions available for your own account"
                        className="ml-auto flex size-7 items-center justify-center rounded-md text-foreground-disabled disabled:cursor-not-allowed"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-foreground-disabled">
                        No access
                      </span>
                    )}
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
            className="flex h-[26px] items-center rounded-md border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground hover:bg-hover"
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-border px-4 py-3 text-[13px] font-medium text-foreground-secondary">
      {children}
    </th>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`flex w-fit items-center rounded-full border px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] ${className}`}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-xs uppercase tracking-[0.6px] text-foreground-muted">
        {label}
      </span>
      <span className="font-display text-lg font-semibold text-foreground">
        {value}
      </span>
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
  return qs ? `/users?${qs}` : "/users";
}
