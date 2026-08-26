# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is pnpm (see `pnpm-lock.yaml` / `pnpm-workspace.yaml`); a `package-lock.json` also exists but should not be treated as authoritative.

- `pnpm dev` — start the Next.js dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — run ESLint (`eslint-config-next` core-web-vitals + typescript rules)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm db:up` / `pnpm db:down` — start/stop Postgres + pgAdmin via `docker-compose.yml`
- `pnpm db:migrate` — `prisma migrate dev`; `pnpm db:studio`, `pnpm db:seed`, `pnpm db:reset`

There is no test suite/framework configured in this repo.

Local setup: `cp .env.example .env`, fill in `AUTH_SECRET` (`npx auth secret`), `pnpm db:up`, `pnpm db:migrate`, `pnpm dev`, then sign up at `/signup`.

## Architecture

Originally a static presentational shell, this now has a **real backend**: PostgreSQL (local Docker) + Prisma, with NextAuth v5 (Auth.js) for authentication.

Next.js App Router (`app/`), React 19, Tailwind CSS v4 (via `@tailwindcss/postcss`, tokens defined in `app/globals.css` using `@theme inline`), `lucide-react` for icons.

### Backend layout

- `prisma/schema.prisma` + `prisma.config.ts` — **Prisma 7**: the datasource URL lives in `prisma.config.ts` (not the schema), `.env` is loaded there via `dotenv`, the generator is `prisma-client` (not `prisma-client-js`) emitting TypeScript to `lib/generated/prisma`, and queries go through the `@prisma/adapter-pg` driver adapter. Import the client from `@/lib/prisma`.
- `auth.config.ts` — edge-safe Auth.js config (providers minus Credentials, `pages`, `authorized`). **Must not import Prisma or bcrypt.**
- `auth.ts` — Node-side: Prisma adapter, Credentials + Google, JWT callbacks, `DeviceSession` lifecycle.
- `proxy.ts` — **Next 16 renamed `middleware.ts` to `proxy.ts`** (exports `proxy` + `config.matcher`, defaults to the Node runtime, and setting `runtime` there throws). It is a *redirect* layer only — it sees just the decoded JWT.
- `lib/auth/require-session.ts` — the real authorization layer. Every protected page and Server Action calls `requireUser()`; it is the only place revocation and account deletion are enforced.
- `lib/queries/*` (read, `React.cache`d), `lib/actions/*` (`"use server"` mutations), `lib/audit.ts`, `lib/tenant.ts` (sign-up bootstrap).

### Auth invariants

- The Credentials provider **forces `session.strategy: "jwt"`**, so the adapter's `Session` table stays permanently empty. The UI's session list is the separate `DeviceSession` model, keyed by the JWT's `sid`.
- Because a JWT is self-contained, revocation only bites where the DB is read — i.e. in `requireUser()`. Changing a password revokes all other `DeviceSession`s.
- Never unlink a user's last remaining sign-in method.

### Data flow

Pages are `async` server components that fetch and pass props down; sections take props. Two exceptions fetch directly (both `cache`d): `Header`/`AccountHeader` (used by five pages) and `AuditLogsTable` (owns its filters and cursor). Mutations are Server Actions ending in `revalidatePath`; route handlers are reserved for `[...nextauth]`, machine APIs, and webhooks. Audit-log filters are URL `searchParams`, not client fetches.

The pattern throughout: **server shell owns layout and copy, a small client leaf owns the interactivity** (`DeleteProjectButton`, `CopyButton`, `ConnectionButton`, …), which keeps `SettingsCard`/`SettingsRow` composition intact.

Dates: render absolute strings from the server; `RelativeTime` upgrades to "2 minutes ago" only after hydration (via `useSyncExternalStore`) to avoid mismatches. Theme has two stores — `UserPreferences.theme` is authoritative, `localStorage` is the paint-blocking cache read by the inline script in `app/layout.tsx`; `useSyncedTheme` writes localStorage first, then the DB.

### Route ↔ layout composition

Each route in `app/` is a thin composition of layout chrome + section components pulled from `components/`. There's no shared root layout beyond fonts/global CSS in `app/layout.tsx` — every page independently composes its own header + sidebar:

- `app/page.tsx` — main dashboard: `Header` + `IconSidebar` (from `components/dashboard/`) wrapping `ProjectOverview`, `RegionMapCard`, `UsageCharts`, `AdvisorPanel`, `ReportsPanel`.
- `app/account/{preferences,security,access-tokens,audit-logs}/page.tsx` — account section: `AccountHeader` + `SettingsSidebar` (from `components/account/`), with an `active` prop identifying the current nav item.
- `app/project/settings/page.tsx` — project settings: `Header` + `IconSidebar` + `ProjectSettingsSidebar` (from `components/project-settings/`), also using an `active` prop for nav state.
- `app/(auth)/{signin,signup}/page.tsx` — the only route group; gives auth pages a bare layout with no dashboard chrome without changing their URLs.

`/` shows the user's default (first) project — there is deliberately no `/project/[ref]` segment.

`NoticeBanner` (dashboard) is rendered at the bottom of every page as a dismissible toast-like element.

### Component organization (by route family, not by type)

- `components/dashboard/` — project-level dashboard chrome and widgets (`Header`, `IconSidebar`, `AppLogo`, `ProjectOverview`, `RegionMapCard`, `UsageCharts`, `AdvisorPanel`, `ReportsPanel`, `NoticeBanner`).
- `components/account/` — account/preferences pages (`AccountHeader`, `SettingsSidebar`, plus each settings section as its own component: `ProfileInformation`, `SignInMethods`, `Connections`, `AppearanceSettings`, `KeyboardShortcuts`, `DashboardSettings`, `AnalyticsMarketing`, `DangerZone`, `AuditLogsTable`). `SettingsPrimitives.tsx` exports the shared `SectionHeading` / `SettingsCard` / `SettingsRow` building blocks used across both `account/` and `project-settings/` sections, and `Switch.tsx` is the shared toggle control.
- `components/project-settings/` — project settings sections (`ProjectSettingsSidebar`, `GeneralSettingsForm`, `ProjectAccess`, `ProjectAvailability`, `ServiceVersions`, `CustomDomains`, `TransferProject`, `DeleteProject`).

When adding a new settings-style section, compose it from `SettingsPrimitives` (`SectionHeading` + `SettingsCard` + `SettingsRow`) rather than rebuilding card/row markup, to stay visually consistent with existing sections.

### Sidebars take an `active` prop

`SettingsSidebar` and `ProjectSettingsSidebar` both take a typed `active` union prop (e.g. `"Preferences" | "Access Tokens" | "Security" | "Audit Logs"`) to highlight the current nav item — pass the matching literal from the page that renders them.

### Naming / configuration conventions

The old `{{APP_NAME}}` / `{{APP_DOMAIN}}` template placeholders are gone. Project-agnostic copy now reads real configuration from `lib/env.ts`: `appName` (`NEXT_PUBLIC_APP_NAME`) and `appDomain` (`NEXT_PUBLIC_APP_DOMAIN`, used to build per-project URLs). Import those rather than hardcoding a name or reintroducing a `{{TOKEN}}`.

`lib/env.ts` parses server environment with zod at import time and throws on anything missing, so a misconfigured `.env` fails at boot instead of deep inside a query. Never import it from a Client Component — client-safe values must go through `NEXT_PUBLIC_*`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
