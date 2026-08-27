"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-session";
import { logAudit } from "@/lib/audit";
import {
  InvalidLogoUpload,
  deleteLogoFile,
  saveLogoFile,
} from "@/lib/logo-storage";

export type LogoActionState = {
  ok?: boolean;
  error?: string;
};

const SETTINGS_ID = "singleton";

/** The logo appears in headers and layouts across nearly every route, so a
 * change is invalidated at the root layout rather than per-page. */
function revalidateEverywhere() {
  revalidatePath("/", "layout");
}

export async function updateLogo(
  _prev: LogoActionState,
  formData: FormData,
): Promise<LogoActionState> {
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

export async function removeLogo(): Promise<LogoActionState> {
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
