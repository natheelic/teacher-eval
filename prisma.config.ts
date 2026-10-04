import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 moved the datasource URL out of schema.prisma and into this file.
// `.env` is not read automatically — the `dotenv/config` import above does it.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI commands should use a direct connection when available.
    // Runtime queries resolve the pooled URL in lib/env.ts instead.
    url:
      process.env["DATABASE_URL"] ??
      process.env["POSTGRES_URL_NON_POOLING"] ??
      process.env["POSTGRES_PRISMA_URL"] ??
      process.env["POSTGRES_URL"],
    // A scratch database Prisma may freely create, replay migrations into, and
    // drop. Required by `prisma migrate diff --from-migrations`, and used to
    // detect schema drift. Never point this at a database holding real data.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
