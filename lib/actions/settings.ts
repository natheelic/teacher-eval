"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-session";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import {
  InvalidLogoUpload,
  deleteLogoFile,
  saveLogoFile,
} from "@/lib/logo-storage";

export type SettingsActionState = {
  ok?: boolean;
  error?: string;
};

/** @deprecated Use SettingsActionState — kept so existing imports keep working. */
export type LogoActionState = SettingsActionState;

const SETTINGS_ID = "singleton";

/** The logo appears in headers and layouts across nearly every route, so a
 * change is invalidated at the root layout rather than per-page. */
function revalidateEverywhere() {
  revalidatePath("/", "layout");
}

export async function updateLogo(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await requireAdmin();

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return { error: "Choose an image file." };
  }

  let logoUrl: string;
  try {
    logoUrl = await saveLogoFile(file);
  } catch (error) {
    if (error instanceof InvalidLogoUpload) {
      return { error: error.message };
    }
    throw error;
  }

  const previous = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { logoUrl: true },
  });

  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, logoUrl },
    update: { logoUrl },
  });

  // Only after the new row is committed — never leave the app pointing at a
  // logo whose file was just deleted.
  await deleteLogoFile(previous?.logoUrl ?? null);

  await logAudit({
    actorId: user.id,
    action: "Updated the app logo",
    actionCode: "settings.logo.updated",
    method: "POST",
    statusCode: 200,
    targetLabel: "App logo",
  });

  revalidateEverywhere();
  return { ok: true };
}

const appNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name")
  .max(60, "Keep the name to 60 characters or fewer");

/**
 * The product name reaches headers, page titles, the landing page and every
 * outbound email, so it gets the same root-layout invalidation the logo does.
 */
export async function updateAppName(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await requireAdmin();

  const parsed = appNameSchema.safeParse(formData.get("appName"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]!.message };
  }
  const appName = parsed.data;

  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, appName },
    update: { appName },
  });

  await logAudit({
    actorId: user.id,
    action: `Changed the app name to "${appName}"`,
    actionCode: "settings.app_name.updated",
    method: "POST",
    statusCode: 200,
    targetLabel: "App name",
    metadata: { appName },
  });

  revalidateEverywhere();
  return { ok: true };
}

export async function removeLogo(): Promise<SettingsActionState> {
  const user = await requireAdmin();

  const previous = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { logoUrl: true },
  });

  if (!previous?.logoUrl) {
    return { ok: true };
  }

  await prisma.appSettings.update({
    where: { id: SETTINGS_ID },
    data: { logoUrl: null },
  });

  await deleteLogoFile(previous.logoUrl);

  await logAudit({
    actorId: user.id,
    action: "Removed the app logo",
    actionCode: "settings.logo.removed",
    method: "POST",
    statusCode: 200,
    targetLabel: "App logo",
  });

  revalidateEverywhere();
  return { ok: true };
}
