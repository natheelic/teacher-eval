import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import { canManageUsers } from "@/lib/permissions";
import { ACTION_CODES, type ActionCode } from "@/lib/action-codes";
import type { Prisma } from "@/lib/generated/prisma/client";

export type AuditLogView = {
  id: string;
  statusCode: number | null;
  method: string | null;
  action: string;
  target: string | null;
  actor: string | null;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
};

export type AuditRange = "24h" | "7d" | "30d" | "all";
export type AuditScope = "mine" | "all";

export type AuditFilters = {
  range: AuditRange;
  scope: AuditScope;
  actionCode: ActionCode | null;
  /** Free-text match against the denormalised targetLabel. */
  target: string;
  cursor: string | null;
};

export type AuditLogPage = {
  rows: AuditLogView[];
  total: number;
  nextCursor: string | null;
  /** Whether the viewer is allowed to see everyone's activity. */
  canSeeAll: boolean;
};

const PAGE_SIZE = 25;

const RANGE_MS: Record<Exclude<AuditRange, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const ACTION_CODE_SET: Set<string> = new Set(ACTION_CODES);

export function parseAuditFilters(params: {
  range?: string | string[];
  scope?: string | string[];
  actionCode?: string | string[];
  target?: string | string[];
  cursor?: string | string[];
}): AuditFilters {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const rawRange = first(params.range);
  const range: AuditRange =
    rawRange === "7d" || rawRange === "30d" || rawRange === "all"
      ? rawRange
      : "24h";

  const rawActionCode = first(params.actionCode);
  const actionCode: ActionCode | null =
    rawActionCode && ACTION_CODE_SET.has(rawActionCode)
      ? (rawActionCode as ActionCode)
      : null;

  return {
    range,
    scope: first(params.scope) === "all" ? "all" : "mine",
    actionCode,
    target: (first(params.target) ?? "").trim().slice(0, 100),
    cursor: first(params.cursor) ?? null,
  };
}

export async function getAuditLogs(
  filters: AuditFilters,
): Promise<AuditLogPage> {
  const viewer = await requireUser();
  const canSeeAll = canManageUsers(viewer.role);

  const where: Prisma.AuditLogWhereInput = {};

  // Scope is enforced here, not trusted from the URL: a member asking for
  // scope=all still only ever sees their own rows.
  if (!canSeeAll || filters.scope === "mine") {
    where.actorId = viewer.id;
  }

  if (filters.range !== "all") {
    where.createdAt = { gte: new Date(Date.now() - RANGE_MS[filters.range]) };
  }

  if (filters.actionCode) {
    where.actionCode = filters.actionCode;
  }

  if (filters.target) {
    where.targetLabel = { contains: filters.target, mode: "insensitive" };
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        statusCode: true,
        method: true,
        action: true,
        targetLabel: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        actor: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return {
    rows: page.map((row) => ({
      id: row.id,
      statusCode: row.statusCode,
      method: row.method,
      action: row.action,
      target: row.targetLabel,
      actor: row.actor ? (row.actor.name?.trim() || row.actor.email) : null,
      createdAt: row.createdAt.toISOString(),
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    })),
    total,
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    canSeeAll,
  };
}
