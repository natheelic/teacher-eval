import { prisma } from "@/lib/prisma";

/**
 * Minimal seed.
 *
 * There is deliberately no demo account here: every tenant is bootstrapped by
 * `signUpAction`, which creates the User, its Organization, the OWNER
 * membership, a first Project and a UserPreferences row in one transaction.
 * Sign up at /signup to get a populated dashboard.
 *
 * All enum-like values (Role, Plan, ProjectStatus, …) are real Postgres enums
 * created by the migration, so there is no lookup data to insert either.
 *
 * This script stays as the place to put genuinely static reference rows if any
 * ever appear, and it is safe to re-run.
 */
async function main() {
  const [users, organizations, projects] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.project.count(),
  ]);

  console.log(
    `Seed: nothing to insert. Current rows — users: ${users}, organizations: ${organizations}, projects: ${projects}.`,
  );
  if (users === 0) {
    console.log("Create your account at http://localhost:3000/signup");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
