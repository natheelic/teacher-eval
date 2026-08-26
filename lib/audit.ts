import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIpFrom } from "@/lib/auth/device";

/**
 * The closed vocabulary of audit action codes. A call site passing anything
 * outside this list fails to typecheck rather than silently writing a row
 * that filtering-by-code (ROADMAP 4.2) can never match. Add a code here
 * before using it anywhere else.
 */
export const ACTION_CODES = [
  // Self-service account actions
  "account.created",
  "account.profile.updated",
  "account.password.changed",
  "account.password.reset_requested",
  "account.password.reset_completed",
  "account.2fa.enabled",
  "account.2fa.disabled",
  "account.session.revoked",
  "account.session.revoked_all",
  "account.connection.removed",
  "account.token.created",
  "account.token.revoked",
  "account.deletion.requested",
  "account.deletion.cancelled",
  // Admin-surface actions on a target user
  "user.invited",
  "user.invitation.accepted",
  "user.invitation.resent",
  "user.role.changed",
  "user.suspended",
  "user.reactivated",
  "user.password.reset",
  "user.deleted",
] as const;

export type ActionCode = (typeof ACTION_CODES)[number];

export type AuditInput = {
  actorId?: string | null;
  /** The user this action was performed on, when it targets someone. */
  targetUserId?: string | null;
  /** Human-readable sentence shown in the Action column. */
  action: string;
  /** Stable machine key used for filtering, e.g. "user.role.changed". */
  actionCode: ActionCode;
  method?: string;
  statusCode?: number;
  /** Denormalised so the row still reads correctly after the target is gone. */
  targetLabel?: string;
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
        targetUserId: input.targetUserId ?? null,
        action: input.action,
        actionCode: input.actionCode,
        method: input.method ?? null,
        statusCode: input.statusCode ?? null,
        targetLabel: input.targetLabel ?? null,
        ipAddress,
        userAgent,
        metadata: input.metadata ? (input.metadata as object) : undefined,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
}
