import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIpFrom } from "@/lib/auth/device";

export type AuditInput = {
  actorId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  /** Human-readable sentence shown in the Action column. */
  action: string;
  /** Stable machine key used for filtering, e.g. "project.updated". */
  actionCode: string;
  method?: string;
  statusCode?: number;
  targetType?: string;
  targetId?: string;
  /** Denormalised so the row still reads correctly after the target is gone. */
  targetLabel?: string;
  targetRef?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Writes one audit row. Called by every mutating Server Action.
 *
 * Auditing must never be the reason a user-visible operation fails, so all
 * errors here are swallowed and logged rather than propagated.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const h = await headers();
      ipAddress = clientIpFrom(h);
      userAgent = h.get("user-agent");
    } catch {
      // Outside a request context (e.g. a script) — record without them.
    }

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        organizationId: input.organizationId ?? null,
        projectId: input.projectId ?? null,
        action: input.action,
        actionCode: input.actionCode,
        method: input.method ?? null,
        statusCode: input.statusCode ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        targetLabel: input.targetLabel ?? null,
        targetRef: input.targetRef ?? null,
        ipAddress,
        userAgent,
        metadata: input.metadata ? (input.metadata as object) : undefined,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
}
