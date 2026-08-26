import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type BootstrapInput = {
  email: string;
  firstName: string;
  lastName?: string | null;
  password: string;
};

/**
 * Creates a user account from the public sign-up form.
 *
 * The first account ever created becomes ADMIN: the seed is deliberately
 * empty, so without this there would be no one able to manage anyone, and the
 * users table would be permanently unreachable. Everyone after that is a
 * MEMBER, to be promoted by an admin.
 *
 * Kept out of the "use server" module so it can be exercised by scripts.
 */
export async function bootstrapUser(input: BootstrapInput) {
  const email = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const displayName = [input.firstName, input.lastName]
    .filter(Boolean)
    .join(" ");

  return prisma.$transaction(async (tx) => {
    const isFirstUser = (await tx.user.count()) === 0;

    const user = await tx.user.create({
      data: {
        email,
        name: displayName,
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        username: await uniqueUsername(tx, email),
        passwordHash,
        passwordUpdatedAt: new Date(),
        role: isFirstUser ? "ADMIN" : "MEMBER",
        status: "ACTIVE",
        preferences: { create: {} },
      },
      select: { id: true, username: true, role: true },
    });

    return { user, isFirstUser };
  });
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "user"
  );
}

export async function uniqueUsername(tx: Tx, email: string): Promise<string> {
  const base = slugify(email.split("@")[0] ?? "user");
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    const taken = await tx.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}-${randomSuffix()}`;
}

function randomSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}
