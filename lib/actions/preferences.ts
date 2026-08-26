"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";

const themeSchema = z.enum(["LIGHT", "DARK", "SYSTEM"]);

export async function updateTheme(value: string): Promise<void> {
  const user = await requireUser();
  const theme = themeSchema.safeParse(value);
  if (!theme.success) return;
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, theme: theme.data },
    update: { theme: theme.data },
  });
}
