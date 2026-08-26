import Link from "next/link";
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
  ACTIVE: "border-[#16b674] bg-[#3fcf8e]/10 text-[#097c4f]",
  INVITED: "border-[#f3ba63] bg-[#ca8a10]/10 text-[#dc7b18]",
  SUSPENDED: "border-[#ab413e]/40 bg-[#ab413e]/10 text-[#ab413e]",
};

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "border-[#030303]/20 bg-black/5 text-[#030303]",
  MANAGER: "border-black/15 bg-white text-[#464646]",
  MEMBER: "border-black/15 bg-white text-[#464646]",
  VIEWER: "border-black/10 bg-white text-[#696969]",
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

      <div className="w-full overflow-x-auto rounded-md border border-black/8">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="bg-black/[0.03]">
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last sign-in</Th>
              <Th>Created</Th>
              <th className="border-b border-black/8 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="bg-white">
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-[13px] font-medium text-[#696969]"
                >
                  No users match these filters.
                </td>
              </tr>
            )}
            {rows.map((row, i) => {
              const border =
                i === rows.length - 1 ? "" : "border-b border-black/8";
              const actionable = canActOnUser(viewer, row);

              return (
                <tr key={row.id} className="bg-white">
                  <td className={`${border} px-4 py-3 align-middle`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-[#030303] text-[13px] font-medium text-white">
                        {row.initial}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-medium text-[#030303]">
                            {row.name?.trim() || row.username || "—"}
                          </span>
                          {row.isYou && (
                            <span className="flex shrink-0 items-center rounded-full border border-black/15 bg-white px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-[#464646]">
                              You
                            </span>
                          )}
                        </span>
                        <span className="truncate text-[13px] font-medium text-[#696969]">
                          {row.email}
                        </span>
                        {row.deletionDeadline && (
                          <span className="truncate text-[13px] font-medium text-[#ab413e]">
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
                    className={`${border} px-4 py-3 align-middle text-[13px] text-[#6f6f6f]`}
                  >
                    {row.lastLoginAt ? (
                      <RelativeTime iso={row.lastLoginAt} />
                    ) : (
                      "Never"
                    )}
                  </td>
                  <td
                    className={`${border} px-4 py-3 align-middle text-[13px] text-[#6f6f6f]`}
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
                    ) : (
                      <span className="text-xs font-medium text-[#a0a0a0]">
                        {row.isYou ? "—" : "No access"}
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
            className="flex h-[26px] items-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 text-xs font-medium text-[#030303] hover:bg-black/4"
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
    <th className="border-b border-black/8 px-4 py-3 text-[13px] font-medium text-[#464646]">
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
      <span className="font-mono text-xs uppercase tracking-[0.6px] text-[#696969]">
        {label}
      </span>
      <span className="font-display text-lg font-semibold text-[#030303]">
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
