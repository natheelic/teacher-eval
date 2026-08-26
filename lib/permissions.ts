import type { Role } from "@/lib/generated/prisma/enums";

/**
 * The one place that answers "who may do what to whom".
 *
 * Kept free of Prisma and request context so it can be reasoned about (and
 * unit-tested) on its own; the Server Actions call these before writing.
 */

/** Higher number = more authority. Used for "may not act on a peer" rules. */
const RANK: Record<Role, number> = {
  ADMIN: 3,
  MANAGER: 2,
  MEMBER: 1,
  VIEWER: 0,
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export const ASSIGNABLE_ROLES: Role[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

/** Can this role open the user-management area at all? */
export function canManageUsers(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * Can `actor` modify `target`?
 *
 * Admins may act on anyone. Managers may only act on strictly lower ranks, so
 * they cannot edit other managers, escalate themselves, or touch an admin.
 * Nobody may act on themselves through the admin surface — self-service lives
 * in /account, and this avoids an admin removing their own access by accident.
 */
export function canActOnUser(
  actor: { id: string; role: Role },
  target: { id: string; role: Role },
): boolean {
  if (actor.id === target.id) return false;
  if (!canManageUsers(actor.role)) return false;
  if (actor.role === "ADMIN") return true;
  return RANK[actor.role] > RANK[target.role];
}

/**
 * Which roles may `actor` assign? A manager must not be able to grant a role
 * at or above their own — that would be privilege escalation.
 */
export function assignableRolesFor(actorRole: Role): Role[] {
  if (actorRole === "ADMIN") return ASSIGNABLE_ROLES;
  if (actorRole === "MANAGER") {
    return ASSIGNABLE_ROLES.filter((r) => RANK[r] < RANK["MANAGER"]);
  }
  return [];
}

export function canAssignRole(actorRole: Role, role: Role): boolean {
  return assignableRolesFor(actorRole).includes(role);
}

/** Deleting a user is admin-only, even though managers can suspend. */
export function canDeleteUsers(role: Role): boolean {
  return role === "ADMIN";
}
