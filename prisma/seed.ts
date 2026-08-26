import { prisma } from "@/lib/prisma";

/**
 * Minimal seed.
 *
 * There is deliberately no demo account: sign up at /signup instead. The very
 * first account created becomes ADMIN (see lib/bootstrap.ts), which is what
 * makes the users table reachable on a fresh database.
 *
 * Roles and statuses are real Postgres enums created by the migration, so
 * there is no lookup data to insert either. Safe to re-run.
 */
async function main() {
  const [users, admins] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, role: "ADMIN" } }),
  ]);

  console.log(`Seed: nothing to insert. Users: ${users}, admins: ${admins}.`);

  if (users === 0) {
    console.log(
      "Create the first account at http://localhost:3000/signup — it becomes the admin.",
    );
  } else if (admins === 0) {
    // Reachable only if every admin was demoted or deleted directly in the DB;
    // the app's own guards prevent removing the last one.
    console.warn(
      "WARNING: there are users but no admin. Promote one with:\n" +
        `  pnpm exec tsx --env-file=.env -e 'import{prisma}from"@/lib/prisma";prisma.user.update({where:{email:"you@example.com"},data:{role:"ADMIN"}}).then(()=>prisma.$disconnect())'`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
