import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import type { Prisma } from "@/lib/generated/prisma/client";

export type AuditLogView = {
  id: string;
  statusCode: number | null;
  method: string | null;
  action: string;
  target: { label: string; ref: string | null } | null;
  createdAt: string;
};

export type AuditRange = "24h" | "7d" | "30d" | "all";

export type AuditFilters = {
  range: AuditRange;
  projectId: string | null;
  cursor: string | null;
};

export type AuditLogPage = {
  rows: AuditLogView[];
  /** A real count, not rows.length — the header claims a total. */
  total: number;
  nextCursor: string | null;
  projects: { id: string; name: string }[];
};

const PAGE_SIZE = 25;

const RANGE_MS: Record<Exclude<AuditRange, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function parseAuditFilters(params: {
  range?: string | string[];
  project?: string | string[];
  cursor?: string | string[];
}): AuditFilters {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const rawRange = first(params.range);
  const range: AuditRange =
    rawRange === "7d" || rawRange === "30d" || rawRange === "all"
      ? rawRange
      : "24h";

  return {
    range,
    projectId: first(params.project) ?? null,
    cursor: first(params.cursor) ?? null,
  };
}

export async function getAuditLogs(
  filters: AuditFilters,
): Promise<AuditLogPage> {
  const user = await requireUser();

  const where: Prisma.AuditLogWhereInput = { actorId: user.id };

  if (filters.range !== "all") {
    where.createdAt = { gte: new Date(Date.now() - RANGE_MS[filters.range]) };
  }
  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  const [rows, total, memberships] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(filters.cursor
        ? { cursor: { id: filters.cursor }, skip: 1 }
        : {}),
      select: {
        id: true,
        statusCode: true,
        method: true,
        action: true,
        targetLabel: true,
        targetRef: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: {
        organization: {
          select: {
            projects: {
              where: { deletedAt: null },
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return {
    rows: page.map((row) => ({
      id: row.id,
      statusCode: row.statusCode,
      method: row.method,
      action: row.action,
      target: row.targetLabel
        ? { label: row.targetLabel, ref: row.targetRef }
        : null,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    projects: memberships.flatMap((m) => m.organization.projects),
  };
}
