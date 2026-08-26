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
    url: process.env["DATABASE_URL"],
  },
});
