"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import { mintToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/audit";

export type CreateTokenState = {
  /** Returned once, immediately after creation, then never again. */
  plaintext?: string;
  tokenName?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const nameSchema = z
  .string()
  .trim()
  .min(1, "Give the token a name")
  .max(80, "Name is too long");

export async function createApiToken(
  _prev: CreateTokenState,
  formData: FormData,
): Promise<CreateTokenState> {
  const user = await requireUser();

  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { fieldErrors: { name: parsed.error.issues[0]?.message ?? "Invalid" } };
  }

  const token = mintToken();

  await prisma.apiToken.create({
    data: {
      userId: user.id,
      name: parsed.data,
      prefix: token.prefix,
      last4: token.last4,
      tokenHash: token.tokenHash,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "Created an access token",
    actionCode: "account.token.created",
    method: "POST",
    statusCode: 201,
    targetType: "token",
    targetLabel: parsed.data,
  });

  revalidatePath("/account/access-tokens");

  // The plaintext leaves the server exactly once, here.
  return { plaintext: token.plaintext, tokenName: parsed.data };
}

export async function revokeApiToken(tokenId: string): Promise<void> {
  const user = await requireUser();

  // Scoped by userId so one user cannot revoke another's token.
  const token = await prisma.apiToken.findFirst({
    where: { id: tokenId, userId: user.id, revokedAt: null },
    select: { id: true, name: true },
  });
  if (!token) return;

  await prisma.apiToken.update({
    where: { id: token.id },
    data: { revokedAt: new Date() },
  });

  await logAudit({
    actorId: user.id,
    action: "Revoked an access token",
    actionCode: "account.token.revoked",
    method: "DELETE",
    statusCode: 200,
    targetType: "token",
    targetId: token.id,
    targetLabel: token.name,
  });

  revalidatePath("/account/access-tokens");
}
