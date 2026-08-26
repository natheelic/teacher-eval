import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUserManager } from "@/lib/auth/require-session";
import { DELETION_GRACE_PERIOD_MS } from "@/lib/auth/deletion";
import { canManageUsers } from "@/lib/permissions";
import { toIso } from "@/lib/format";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Role, UserStatus } from "@/lib/generated/prisma/enums";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: Role;
  status: UserStatus;
  initial: string;
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  isYou: boolean;
  /** When set, the account is soft-deleted at this instant unless cancelled first. */
  deletionDeadline: string | null;
};

export type UserFilters = {
  query: string;
  role: Role | null;
  status: UserStatus | null;
  cursor: string | null;
};

export type UserPage = {
  rows: UserRow[];
  /** A real count of everything matching the filter, not rows.length. */
  total: number;
  nextCursor: string | null;
  /** Counts for the summary line, unaffected by the current filter. */
  stats: { total: number; active: number; suspended: number; admins: number };
};

const PAGE_SIZE = 25;

const ROLES: Role[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];
const STATUSES: UserStatus[] = ["ACTIVE", "INVITED", "SUSPENDED"];

export function parseUserFilters(params: {
  q?: string | string[];
  role?: string | string[];
  status?: string | string[];
  cursor?: string | string[];
}): UserFilters {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const role = first(params.role);
  const status = first(params.status);

  return {
    query: (first(params.q) ?? "").trim().slice(0, 100),
    role: ROLES.includes(role as Role) ? (role as Role) : null,
    status: STATUSES.includes(status as UserStatus)
      ? (status as UserStatus)
      : null,
    cursor: first(params.cursor) ?? null,
  };
}

export async function getUsers(filters: UserFilters): Promise<UserPage> {
  const viewer = await requireUserManager();

  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (filters.query) {
    where.OR = [
      { email: { contains: filters.query, mode: "insensitive" } },
      { name: { contains: filters.query, mode: "insensitive" } },
      { username: { contains: filters.query, mode: "insensitive" } },
    ];
  }
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;

  const [rows, total, stats] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        status: true,
        passwordHash: true,
        lastLoginAt: true,
        createdAt: true,
        deletionRequestedAt: true,
      },
    }),
    prisma.user.count({ where }),
    getUserStats(),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return {
    rows: page.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      role: row.role,
      status: row.status,
      initial: (row.name?.trim() || row.email)[0]!.toUpperCase(),
      // Never leak the hash itself — only whether one exists.
      hasPassword: Boolean(row.passwordHash),
      lastLoginAt: toIso(row.lastLoginAt),
      createdAt: row.createdAt.toISOString(),
      isYou: row.id === viewer.id,
      deletionDeadline: row.deletionRequestedAt
        ? new Date(
            row.deletionRequestedAt.getTime() + DELETION_GRACE_PERIOD_MS,
          ).toISOString()
        : null,
    })),
    total,
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    stats,
  };
}

export type UserSearchHit = { id: string; label: string; email: string };

/**
 * For the ⌘K command palette — a short, live list, not the full users table.
 * Uses getCurrentUser() rather than requireUserManager(): the palette is
 * reachable by any signed-in role, and a member typing in it should just get
 * no user results, not a redirect() thrown mid-keystroke.
 */
export async function searchUsersForPalette(
  query: string,
): Promise<UserSearchHit[]> {
  const viewer = await getCurrentUser();
  if (!viewer || !canManageUsers(viewer.role)) return [];

  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];

  const rows = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true },
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.name?.trim() || row.email,
    email: row.email,
  }));
}

export type UserStats = { total: number; active: number; suspended: number; admins: number };

/** Standalone for the dashboard overview; getUsers() also calls it internally. */
export async function getUserStats(): Promise<UserStats> {
  await requireUserManager();
  const [total, active, suspended, admins] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.user.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
    prisma.user.count({ where: { deletedAt: null, role: "ADMIN" } }),
  ]);
  return { total, active, suspended, admins };
}
