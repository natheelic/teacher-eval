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
 * Creates a user together with everything the dashboard needs to render:
 * an Organization they own, a first Project, and a preferences row.
 *
 * The seed is deliberately minimal, so this is what makes a fresh account
 * land on a populated dashboard instead of an empty one. Kept out of the
 * "use server" module so it can be exercised directly by scripts and tests.
 */
export async function bootstrapTenant(input: BootstrapInput) {
  const email = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const displayName = [input.firstName, input.lastName]
    .filter(Boolean)
    .join(" ");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: displayName,
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        username: await uniqueUsername(tx, email),
        passwordHash,
        passwordUpdatedAt: new Date(),
        preferences: { create: {} },
      },
      select: { id: true, username: true },
    });

    const organization = await tx.organization.create({
      data: {
        name: `${input.firstName}'s Organization`,
        slug: await uniqueSlug(tx, user.username ?? "workspace"),
        members: { create: { userId: user.id, role: "OWNER" } },
      },
      select: { id: true },
    });

    const project = await tx.project.create({
      data: {
        organizationId: organization.id,
        name: "my-project",
        ref: await uniqueProjectRef(tx),
      },
      select: { id: true, ref: true },
    });

    return { user, organization, project };
  });
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace"
  );
}

async function uniqueUsername(tx: Tx, email: string): Promise<string> {
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

async function uniqueSlug(tx: Tx, base: string): Promise<string> {
  const root = slugify(base);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i}`;
    const taken = await tx.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${root}-${randomSuffix()}`;
}

async function uniqueProjectRef(tx: Tx): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = randomSuffix(20);
    const taken = await tx.project.findUnique({
      where: { ref: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return randomSuffix(24);
}

function randomSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}
