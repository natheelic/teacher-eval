import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // lib/env.ts throws at import time if these aren't set. Loading .env here
    // (same file `pnpm dev`/`prisma.config.ts` already read) lets tests that
    // transitively import modules depending on it — e.g. lib/auth/totp.ts —
    // run locally without duplicating config. In CI these are already set as
    // job-level env vars, so this is a harmless no-op there.
    setupFiles: ["dotenv/config"],
  },
});
