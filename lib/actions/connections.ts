"use server";

import { revalidatePath } from "next/cache";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import { logAudit } from "@/lib/audit";

/**
 * Linking is an explicit, authenticated action rather than automatic on
 * sign-in: Auth.js refuses to auto-attach an OAuth identity to an existing
 * password account, and doing it silently would be an account-takeover vector.
 */
export async function linkProvider(provider: string): Promise<void> {
  await requireUser();
  await signIn(provider, { redirectTo: "/account/preferences" });
}

export async function unlinkProvider(provider: string): Promise<void> {
  const user = await requireUser();

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { provider: true, providerAccountId: true },
  });

  const remainingMethods =
    accounts.filter((a) => a.provider !== provider).length +
    (user.hasPassword ? 1 : 0);

  // Never remove the last way in.
  if (remainingMethods < 1) return;

  await prisma.account.deleteMany({ where: { userId: user.id, provider } });

  await logAudit({
    actorId: user.id,
    action: `Disconnected ${provider}`,
    actionCode: "account.connection.removed",
    method: "DELETE",
    statusCode: 200,
    targetUserId: user.id,
    targetLabel: provider,
  });

  revalidatePath("/account/preferences");
}
