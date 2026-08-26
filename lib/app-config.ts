/**
 * Client-safe display configuration.
 *
 * Only `NEXT_PUBLIC_*` values live here. Next inlines them at build time, so
 * this module is safe to import from Client Components.
 *
 * Deliberately separate from `lib/env.ts`: that module validates server
 * secrets and throws when they are missing, which would blow up in the browser
 * where `DATABASE_URL` and `AUTH_SECRET` are (correctly) undefined.
 */
export const appName = process.env.NEXT_PUBLIC_APP_NAME || "Portal";
export const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "portal.local";
