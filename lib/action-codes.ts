/**
 * The closed vocabulary of audit action codes. A call site passing anything
 * outside this list fails to typecheck rather than silently writing a row
 * that filtering-by-code (ROADMAP 4.2) can never match. Add a code here
 * before using it anywhere else.
 *
 * Split out from lib/audit.ts (which needs next/headers and Prisma, both
 * server-only) so the vocabulary itself can be imported from a Client
 * Component — the audit-log filter UI needs the list to render its
 * "Filter by action" select without pulling the Prisma client into the
 * browser bundle.
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
  // App-wide settings (admin panel)
  "settings.logo.updated",
  "settings.logo.removed",
] as const;

export type ActionCode = (typeof ACTION_CODES)[number];
