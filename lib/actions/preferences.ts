"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";

/**
 * Each toggle in the UI updates optimistically and calls one of these. They
 * upsert because an OAuth-created user may not have a preferences row yet.
 */
async function upsert(
  userId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await prisma.userPreferences.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

const themeSchema = z.enum(["LIGHT", "DARK", "SYSTEM"]);
const sidebarSchema = z.enum(["OPEN", "CLOSED", "EXPAND_ON_HOVER"]);

export async function updateTheme(value: string): Promise<void> {
  const user = await requireUser();
  const theme = themeSchema.safeParse(value);
  if (!theme.success) return;
  await upsert(user.id, { theme: theme.data });
}

export async function updateSidebarBehavior(value: string): Promise<void> {
  const user = await requireUser();
  const parsed = sidebarSchema.safeParse(value);
  if (!parsed.success) return;
  await upsert(user.id, { sidebarBehavior: parsed.data });
  revalidatePath("/account/preferences");
}

export async function updateTelemetry(enabled: boolean): Promise<void> {
  const user = await requireUser();
  await upsert(user.id, { telemetryEnabled: enabled });
  revalidatePath("/account/preferences");
}

const DASHBOARD_KEYS = ["editEntitiesInCode", "queueTableOperations"] as const;
export type DashboardKey = (typeof DASHBOARD_KEYS)[number];

export async function updateDashboardSetting(
  key: DashboardKey,
  enabled: boolean,
): Promise<void> {
  const user = await requireUser();
  if (!DASHBOARD_KEYS.includes(key)) return;
  await upsert(user.id, { [key]: enabled });
  revalidatePath("/account/preferences");
}

export async function toggleShortcut(
  slug: string,
  enabled: boolean,
): Promise<void> {
  const user = await requireUser();
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return;

  const existing = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
    select: { keyboardShortcuts: true },
  });

  const current = (existing?.keyboardShortcuts as Record<string, boolean>) ?? {};
  await upsert(user.id, { keyboardShortcuts: { ...current, [slug]: enabled } });
  revalidatePath("/account/preferences");
}
