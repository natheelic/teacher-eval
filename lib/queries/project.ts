import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWorkspace } from "@/lib/queries/workspace";

export type ProjectSettingsData = {
  id: string;
  name: string;
  ref: string;
  region: string;
  regionLabel: string;
  status: "ACTIVE" | "PAUSED" | "RESTARTING" | "PROVISIONING" | "UNHEALTHY" | "DELETING";
  authVersion: string;
  apiVersion: string;
  dbVersion: string;
  plan: "FREE" | "PRO" | "TEAM" | "ENTERPRISE";
  organizationName: string;
  orgMemberCount: number;
  viewerRole: "OWNER" | "ADMIN" | "DEVELOPER" | "READ_ONLY";
  members: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isYou: boolean;
  }[];
  domains: { id: string; hostname: string; status: string }[];
  transferTargets: { id: string; name: string }[];
};

/** Latest available Postgres build; drives the upgrade banner. */
export const LATEST_DB_VERSION = "17.6.1.155";

export const getProjectSettings = cache(
  async (): Promise<ProjectSettingsData> => {
    const { user, organization, project } = await getWorkspace();
    if (!project) notFound();

    const [row, members, transferTargets] = await Promise.all([
      prisma.project.findUnique({
        where: { id: project.id },
        select: {
          id: true,
          name: true,
          ref: true,
          region: true,
          regionLabel: true,
          status: true,
          authVersion: true,
          apiVersion: true,
          dbVersion: true,
          domains: {
            select: { id: true, hostname: true, status: true },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.organizationMember.findMany({
        where: { organizationId: organization.id },
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          user: { select: { id: true, email: true, name: true } },
        },
      }),
      // The copy says a project can only move to an org you own.
      prisma.organizationMember.findMany({
        where: {
          userId: user.id,
          role: "OWNER",
          NOT: { organizationId: organization.id },
        },
        select: { organization: { select: { id: true, name: true } } },
      }),
    ]);

    if (!row) notFound();

    return {
      ...row,
      plan: organization.plan,
      organizationName: organization.name,
      orgMemberCount: organization.memberCount,
      viewerRole: organization.role,
      members: members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
        role: roleLabel(m.role),
        isYou: m.user.id === user.id,
      })),
      transferTargets: transferTargets.map((t) => t.organization),
    };
  },
);

function roleLabel(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
