import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/generated/prisma/enums";
import {
  ASSIGNABLE_ROLES,
  assignableRolesFor,
  canActOnUser,
  canAssignRole,
  canDeleteUsers,
  canManageUsers,
} from "@/lib/permissions";

const ROLES: Role[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

function user(id: string, role: Role) {
  return { id, role };
}

describe("canManageUsers", () => {
  it("admits admins and managers", () => {
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("MANAGER")).toBe(true);
  });

  it("rejects members and viewers", () => {
    expect(canManageUsers("MEMBER")).toBe(false);
    expect(canManageUsers("VIEWER")).toBe(false);
  });
});

describe("canActOnUser", () => {
  it("never allows acting on yourself, regardless of role", () => {
    for (const role of ROLES) {
      expect(canActOnUser(user("1", role), user("1", role))).toBe(false);
    }
  });

  it("admin may act on anyone but themselves", () => {
    for (const targetRole of ROLES) {
      if (targetRole === "ADMIN") continue;
      expect(canActOnUser(user("actor", "ADMIN"), user("target", targetRole))).toBe(true);
    }
    // admin acting on another admin is allowed (peer-to-peer among admins is fine)
    expect(canActOnUser(user("actor", "ADMIN"), user("target", "ADMIN"))).toBe(true);
  });

  it("members and viewers can never act on anyone", () => {
    for (const actorRole of ["MEMBER", "VIEWER"] as Role[]) {
      for (const targetRole of ROLES) {
        expect(canActOnUser(user("actor", actorRole), user("target", targetRole))).toBe(false);
      }
    }
  });

  it("manager may act only on strictly lower ranks", () => {
    expect(canActOnUser(user("actor", "MANAGER"), user("target", "MEMBER"))).toBe(true);
    expect(canActOnUser(user("actor", "MANAGER"), user("target", "VIEWER"))).toBe(true);
  });

  it("manager may not act on another manager (no peer action)", () => {
    expect(canActOnUser(user("actor", "MANAGER"), user("target", "MANAGER"))).toBe(false);
  });

  it("manager may not act on an admin (no upward action)", () => {
    expect(canActOnUser(user("actor", "MANAGER"), user("target", "ADMIN"))).toBe(false);
  });
});

describe("assignableRolesFor", () => {
  it("admin may assign any role", () => {
    expect(assignableRolesFor("ADMIN")).toEqual(ASSIGNABLE_ROLES);
  });

  it("manager may only assign roles strictly below manager", () => {
    expect(assignableRolesFor("MANAGER").sort()).toEqual(["MEMBER", "VIEWER"].sort());
  });

  it("manager may not assign manager or admin (no self-rank or escalation)", () => {
    const assignable = assignableRolesFor("MANAGER");
    expect(assignable).not.toContain("MANAGER");
    expect(assignable).not.toContain("ADMIN");
  });

  it("members and viewers may assign nothing", () => {
    expect(assignableRolesFor("MEMBER")).toEqual([]);
    expect(assignableRolesFor("VIEWER")).toEqual([]);
  });
});

describe("canAssignRole", () => {
  it("mirrors assignableRolesFor for every actor/role combination", () => {
    for (const actorRole of ROLES) {
      for (const role of ROLES) {
        expect(canAssignRole(actorRole, role)).toBe(
          assignableRolesFor(actorRole).includes(role),
        );
      }
    }
  });

  it("blocks a manager from escalating to admin or their own rank", () => {
    expect(canAssignRole("MANAGER", "ADMIN")).toBe(false);
    expect(canAssignRole("MANAGER", "MANAGER")).toBe(false);
  });
});

describe("canDeleteUsers", () => {
  it("is admin-only", () => {
    expect(canDeleteUsers("ADMIN")).toBe(true);
    expect(canDeleteUsers("MANAGER")).toBe(false);
    expect(canDeleteUsers("MEMBER")).toBe(false);
    expect(canDeleteUsers("VIEWER")).toBe(false);
  });
});
