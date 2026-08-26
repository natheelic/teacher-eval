import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import { appDomain } from "@/lib/app-config";
import { toIso } from "@/lib/format";

export type WorkspaceContext = {
  user: {
    id: string;
    name: string | null;
    email: string;
    initial: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: "FREE" | "PRO" | "TEAM" | "ENTERPRISE";
    memberCount: number;
    role: "OWNER" | "ADMIN" | "DEVELOPER" | "READ_ONLY";
  };
  project: {
    id: string;
    name: string;
    ref: string;
  } | null;
};

/**
 * The org + project every page's chrome needs. Routing keeps `/` pointing at
 * the user's default project (their first one) rather than a `/project/[ref]`
 * segment, so "default" is resolved here in one place.
 *
 * `cache` dedupes this across the header, the page and each section within a
 * single render.
 */
export const getWorkspace = cache(async (): Promise<WorkspaceContext> => {
  const user = await requireUser();

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          _count: { select: { members: true } },
          projects: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { id: true, name: true, ref: true },
          },
        },
      },
    },
  });

  if (!membership) {
    // Every account gets an organization at sign-up, so this means the tenant
    // was deleted out from under the session.
    notFound();
  }

  const org = membership.organization;
  const project = org.projects[0] ?? null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      initial: initialOf(user.name, user.email),
    },
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      memberCount: org._count.members,
      role: membership.role,
    },
    project,
  };
});

export type ProjectOverviewData = {
  name: string;
  ref: string;
  url: string;
  status: "ACTIVE" | "PAUSED" | "RESTARTING" | "PROVISIONING" | "UNHEALTHY" | "DELETING";
  compute: "NANO" | "MICRO" | "SMALL" | "MEDIUM" | "LARGE";
  region: string;
  regionLabel: string;
  githubRepo: string | null;
  recentBranch: string | null;
  lastMigration: { name: string | null; at: string } | null;
  lastBackupAt: string | null;
  authVersion: string;
  apiVersion: string;
  dbVersion: string;
};

export const getDefaultProject = cache(
  async (): Promise<ProjectOverviewData | null> => {
    const { project } = await getWorkspace();
    if (!project) return null;

    const row = await prisma.project.findUnique({
      where: { id: project.id },
      select: {
        name: true,
        ref: true,
        status: true,
        compute: true,
        region: true,
        regionLabel: true,
        githubRepo: true,
        recentBranch: true,
        lastMigrationAt: true,
        lastMigrationName: true,
        lastBackupAt: true,
        authVersion: true,
        apiVersion: true,
        dbVersion: true,
      },
    });
    if (!row) return null;

    return {
      name: row.name,
      ref: row.ref,
      url: `https://${row.ref}.${appDomain}`,
      status: row.status,
      compute: row.compute,
      region: row.region,
      regionLabel: row.regionLabel,
      githubRepo: row.githubRepo,
      recentBranch: row.recentBranch,
      lastMigration: row.lastMigrationAt
        ? { name: row.lastMigrationName, at: row.lastMigrationAt.toISOString() }
        : null,
      lastBackupAt: toIso(row.lastBackupAt),
      authVersion: row.authVersion,
      apiVersion: row.apiVersion,
      dbVersion: row.dbVersion,
    };
  },
);

function initialOf(name: string | null, email: string): string {
  const source = name?.trim() || email;
  return (source[0] ?? "U").toUpperCase();
}
