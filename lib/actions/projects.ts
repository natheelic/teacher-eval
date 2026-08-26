"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import { logAudit } from "@/lib/audit";
import { LATEST_DB_VERSION } from "@/lib/queries/project";
import type { ActionState } from "@/lib/actions/profile";
import type { Role } from "@/lib/generated/prisma/enums";

/**
 * Resolves a project the caller may actually administer.
 *
 * Every mutation goes through this: the proxy cannot check membership (it has
 * no database access), so authorization has to happen here, on the Node side.
 */
async function requireProjectAccess(
  projectId: string,
  allowed: readonly Role[] = ["OWNER", "ADMIN"],
) {
  const user = await requireUser();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      organization: {
        members: { some: { userId: user.id, role: { in: [...allowed] } } },
      },
    },
    select: {
      id: true,
      name: true,
      ref: true,
      organizationId: true,
      dbVersion: true,
    },
  });

  if (!project) {
    throw new Error("Project not found or insufficient permissions");
  }

  return { user, project };
}

const updateSchema = z.object({
  projectId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(80, "Project name is too long"),
});

export async function updateProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { user, project } = await requireProjectAccess(parsed.data.projectId);

  await prisma.project.update({
    where: { id: project.id },
    data: { name: parsed.data.name },
  });

  await logAudit({
    actorId: user.id,
    organizationId: project.organizationId,
    projectId: project.id,
    action: "Updated project settings",
    actionCode: "project.updated",
    method: "POST",
    statusCode: 200,
    targetType: "project",
    targetId: project.id,
    targetLabel: parsed.data.name,
    targetRef: project.ref,
  });

  revalidatePath("/project/settings");
  revalidatePath("/");
  return { ok: true };
}

export async function pauseProject(projectId: string): Promise<void> {
  const { user, project } = await requireProjectAccess(projectId);

  await prisma.project.update({
    where: { id: project.id },
    data: { status: "PAUSED", pausedAt: new Date() },
  });

  await logAudit({
    actorId: user.id,
    organizationId: project.organizationId,
    projectId: project.id,
    action: "Paused the project",
    actionCode: "project.paused",
    method: "POST",
    statusCode: 200,
    targetType: "project",
    targetId: project.id,
    targetLabel: project.name,
    targetRef: project.ref,
  });

  revalidatePath("/project/settings");
  revalidatePath("/");
}

export async function resumeProject(projectId: string): Promise<void> {
  const { user, project } = await requireProjectAccess(projectId);

  await prisma.project.update({
    where: { id: project.id },
    data: { status: "ACTIVE", pausedAt: null },
  });

  await logAudit({
    actorId: user.id,
    organizationId: project.organizationId,
    projectId: project.id,
    action: "Resumed the project",
    actionCode: "project.resumed",
    method: "POST",
    statusCode: 200,
    targetType: "project",
    targetId: project.id,
    targetLabel: project.name,
    targetRef: project.ref,
  });

  revalidatePath("/project/settings");
  revalidatePath("/");
}

export async function restartProject(projectId: string): Promise<void> {
  const { user, project } = await requireProjectAccess(projectId);

  // No real infrastructure behind this template, so the restart is recorded
  // and the project returns to ACTIVE immediately.
  await prisma.project.update({
    where: { id: project.id },
    data: { status: "ACTIVE", restartedAt: new Date() },
  });

  await logAudit({
    actorId: user.id,
    organizationId: project.organizationId,
    projectId: project.id,
    action: "Restarted the project",
    actionCode: "project.restarted",
    method: "POST",
    statusCode: 200,
    targetType: "project",
    targetId: project.id,
    targetLabel: project.name,
    targetRef: project.ref,
  });

  revalidatePath("/project/settings");
  revalidatePath("/");
}

export async function upgradeDatabase(projectId: string): Promise<void> {
  const { user, project } = await requireProjectAccess(projectId);
  if (project.dbVersion === LATEST_DB_VERSION) return;

  await prisma.project.update({
    where: { id: project.id },
    data: { dbVersion: LATEST_DB_VERSION },
  });

  await logAudit({
    actorId: user.id,
    organizationId: project.organizationId,
    projectId: project.id,
    action: `Upgraded database to ${LATEST_DB_VERSION}`,
    actionCode: "project.database.upgraded",
    method: "POST",
    statusCode: 200,
    targetType: "project",
    targetId: project.id,
    targetLabel: project.name,
    targetRef: project.ref,
  });

  revalidatePath("/project/settings");
}

export async function transferProject(
  projectId: string,
  targetOrganizationId: string,
): Promise<void> {
  // Transferring is owner-only, per the section's copy.
  const { user, project } = await requireProjectAccess(projectId, ["OWNER"]);

  const target = await prisma.organizationMember.findFirst({
    where: {
      organizationId: targetOrganizationId,
      userId: user.id,
      role: "OWNER",
    },
    select: { organizationId: true },
  });
  if (!target) return;

  await prisma.project.update({
    where: { id: project.id },
    data: { organizationId: target.organizationId },
  });

  await logAudit({
    actorId: user.id,
    organizationId: target.organizationId,
    projectId: project.id,
    action: "Transferred the project to another organization",
    actionCode: "project.transferred",
    method: "POST",
    statusCode: 200,
    targetType: "project",
    targetId: project.id,
    targetLabel: project.name,
    targetRef: project.ref,
  });

  revalidatePath("/project/settings");
  revalidatePath("/");
}

export async function deleteProject(projectId: string): Promise<void> {
  const { user, project } = await requireProjectAccess(projectId, ["OWNER"]);

  // Soft delete: every query already filters on deletedAt, and this keeps
  // audit rows pointing at something real.
  await prisma.project.update({
    where: { id: project.id },
    data: { deletedAt: new Date(), status: "DELETING" },
  });

  await logAudit({
    actorId: user.id,
    organizationId: project.organizationId,
    projectId: project.id,
    action: "Deleted the project",
    actionCode: "project.deleted",
    method: "DELETE",
    statusCode: 200,
    targetType: "project",
    targetId: project.id,
    targetLabel: project.name,
    targetRef: project.ref,
  });

  revalidatePath("/");
  redirect("/");
}
