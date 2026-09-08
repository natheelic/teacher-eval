import { config as loadEnv } from "dotenv";
loadEnv();

const { prisma } = await import("../lib/prisma");
const { hashPassword } = await import("../lib/auth/password");
const { uniqueUsername } = await import("../lib/bootstrap");

const email = "admin@local.dev";
const password = process.argv[2];

if (!password) {
  console.error("Usage: tsx scripts/create-admin.ts <password>");
  process.exit(1);
}

const existing = await prisma.user.findUnique({
  where: { email },
  select: { id: true, role: true, status: true },
});

if (existing) {
  console.error(`A user with ${email} already exists (role=${existing.role}, status=${existing.status}). Aborting.`);
  process.exit(1);
}

const passwordHash = await hashPassword(password);

const user = await prisma.$transaction(async (tx) => {
  return tx.user.create({
    data: {
      email,
      name: "Admin",
      firstName: "Admin",
      lastName: null,
      username: await uniqueUsername(tx, email),
      passwordHash,
      passwordUpdatedAt: new Date(),
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      preferences: { create: {} },
    },
    select: { id: true, email: true, username: true, role: true, status: true },
  });
});

console.log("Created admin account:");
console.log(JSON.stringify(user, null, 2));
console.log(`\nPassword: ${password}`);

await prisma.$disconnect();
