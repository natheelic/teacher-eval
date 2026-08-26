# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

- **`docs/SRS.md`** — the requirements specification (IEEE-830). What the system must do, every rule traced to the file that implements it, and an explicit list of what is deliberately out of scope. **Read it before changing authorization, auth, or the data model.**
- **`docs/ROADMAP.md`** — what is shipped versus what is a shell, and in what order the gaps should close.
- **`README.md`** — setup and orientation for humans.

Several toggles in this app persist state that nothing reads (see [Known shells](#known-shells)). Before "fixing" one, check `docs/ROADMAP.md` — the gap is usually known and sometimes the intended resolution is deletion, not implementation.

## Commands

Package manager is pnpm (see `pnpm-lock.yaml` / `pnpm-workspace.yaml`); a `package-lock.json` also exists but should not be treated as authoritative.

- `pnpm dev` — start the Next.js dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — run ESLint (`eslint-config-next` core-web-vitals + typescript rules)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm db:up` / `pnpm db:down` — start/stop Postgres + pgAdmin via `docker-compose.yml`
- `pnpm db:migrate` — `prisma migrate dev`; `pnpm db:studio`, `pnpm db:seed`, `pnpm db:reset`

Destructive schema changes make `prisma migrate dev` prompt, which fails in a non-interactive shell. Generate the SQL with `prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script` (needs `SHADOW_DATABASE_URL`), **check its statement order**, then apply with `prisma migrate deploy`. Note that `SHADOW_DATABASE_URL` is read by `prisma.config.ts` but is **not** listed in `.env.example` — you have to add it yourself.

`pnpm db:seed` inserts nothing; it only reports row counts. A fresh database is populated by signing up.

There is no test suite/framework configured in this repo.

Local setup: `cp .env.example .env`, fill in `AUTH_SECRET` (`npx auth secret`), `pnpm db:up`, `pnpm db:migrate`, `pnpm dev`, then sign up at `/signup`.

## Architecture

A **user-management application**: PostgreSQL (local Docker) + Prisma, with NextAuth v5 (Auth.js) for authentication. It began as a static Supabase-style hosting-console template; that domain layer (organizations, projects, domains, service versions) was deliberately removed. The app now does exactly one job — manage user accounts, roles and access.

Next.js App Router (`app/`), React 19, Tailwind CSS v4 (via `@tailwindcss/postcss`, tokens defined in `app/globals.css` using `@theme inline`), `lucide-react` for icons.

### Backend layout

- `prisma/schema.prisma` + `prisma.config.ts` — **Prisma 7**: the datasource URL lives in `prisma.config.ts` (not the schema), `.env` is loaded there via `dotenv`, the generator is `prisma-client` (not `prisma-client-js`) emitting TypeScript to `lib/generated/prisma`, and queries go through the `@prisma/adapter-pg` driver adapter. Import the client from `@/lib/prisma`.
- `auth.config.ts` — edge-safe Auth.js config (providers minus Credentials, `pages`, `authorized`, `isPublicPath`). **Must not import Prisma or bcrypt.**
- `auth.ts` — Node-side: Prisma adapter, Credentials + Google, JWT callbacks, `DeviceSession` lifecycle.
- `proxy.ts` — **Next 16 renamed `middleware.ts` to `proxy.ts`** (exports `proxy` + `config.matcher`, defaults to the Node runtime, and setting `runtime` there throws). It is a *redirect* layer only — it sees just the decoded JWT.
- `lib/auth/require-session.ts` — the real authorization layer. Every protected page and Server Action calls `requireUser()`; it is the only place revocation and account deletion are enforced.
- `lib/auth/{device,password,tokens}.ts` — user-agent parsing for `DeviceSession` labels, bcrypt hash/verify, and API-token minting/hashing. `tokenPreview()` in `tokens.ts` currently has no callers; the preview string is re-inlined in `lib/queries/account.ts`.
- `lib/permissions.ts` — the single source of truth for who may act on whom. Pure functions, no Prisma, no request context.
- `lib/queries/*` (read, `React.cache`d), `lib/actions/*` (`"use server"` mutations), `lib/audit.ts`, `lib/bootstrap.ts` (sign-up), `lib/format.ts` (display formatting).

### Roles

`ADMIN` > `MANAGER` > `MEMBER` > `VIEWER`. Admins and managers reach `/` (the users table); members and viewers are redirected to `/account/preferences`.

Rules enforced in `lib/permissions.ts` and applied by every action in `lib/actions/users.ts`:

- Nobody may act on **themselves** through the admin surface — self-service lives in `/account`.
- A manager may only act on **strictly lower** ranks, and may only assign roles below their own. Both together prevent privilege escalation.
- Deleting is **admin-only**; managers may suspend instead.
- `assertNotLastAdmin` blocks demoting, suspending or deleting the final active admin — otherwise the users table becomes permanently unreachable.

Every action in `lib/actions/users.ts` routes through the private `loadActionable(targetId)` helper, which runs `requireUserManager()` + `canActOnUser()` in one place. New administrative actions should use it rather than re-deriving the check.

**The first account created (via `/signup`) becomes `ADMIN`**; everyone after is a `MEMBER`. That is what makes a fresh database usable.

Suspension and password resets revoke the target's `DeviceSession` rows, and `requireUser()` rejects `SUSPENDED`, so both take effect on the very next request.

Deletion is a **soft delete**: `deletedAt` is set, status becomes `SUSPENDED`, the email is rewritten to `deleted+<id>@invalid.local` and the username is nulled — so audit history survives and the address is freed without violating the unique constraint.

### Auth invariants

- The Credentials provider **forces `session.strategy: "jwt"`**, so the adapter's `Session` table stays permanently empty. The UI's session list is the separate `DeviceSession` model, keyed by the JWT's `sid`.
- Because a JWT is self-contained, revocation only bites where the DB is read — i.e. in `requireUser()`. Changing a password revokes all other `DeviceSession`s.
- Never unlink a user's last remaining sign-in method.
- Auditing must never be the reason a user-visible operation fails — `logAudit` swallows its own errors by design. Don't add a code path that depends on it having succeeded.

### Known shells

These are persisted-but-inert, and the UI implies otherwise. Don't mistake them for working features, and don't assume the gap is an oversight — `docs/ROADMAP.md` Phase 1 covers each, and for some the intended resolution is removal:

- **Two-factor auth** — `setTwoFactorEnabled` flips a boolean; `twoFactorSecret` is never written and sign-in has no second-factor step.
- **`User.lastLoginAt`** — selected and rendered in `UsersTable`, never written.
- **`sidebarBehavior`** — stored and selectable; no sidebar reads it.
- **`telemetryEnabled`, `editEntitiesInCode`, `queueTableOperations`** — stored; nothing consults them.
- **Keyboard shortcuts** — toggles persist, but only ⌘K is implemented, and several labels name features removed with the tenancy layer.
- **API tokens** — mintable and revocable, but no route authenticates with them; `scopes`, `expiresAt` and `lastUsedAt` are never written or checked.
- **`UserStatus.INVITED`** — a filter option no code path can produce; `createUser` hardcodes `ACTIVE`.
- **`Authenticator` and `VerificationToken`** — dead models. No WebAuthn, no email verification, no password-reset flow.
- **`NoticeBanner`** — hardcoded copy with a dead button, rendered on every page. The Feedback/Docs/Bell buttons in the headers and the sidebar collapse control are likewise non-functional.

### Data flow

Pages are `async` server components that fetch and pass props down; sections take props. Two exceptions fetch directly (both `cache`d): `Header`/`AccountHeader` (used by five pages) and `AuditLogsTable` (owns its filters and cursor). Mutations are Server Actions ending in `revalidatePath`; route handlers are reserved for `[...nextauth]`, machine APIs, and webhooks. Audit-log filters are URL `searchParams`, not client fetches.

The pattern throughout: **server shell owns layout and copy, a small client leaf owns the interactivity** (`UserRowActions`, `CopyButton`, `ConnectionButton`, `AccountDeletionButton`, …), which keeps `SettingsCard`/`SettingsRow` composition intact.

Dates: render absolute strings from the server; `RelativeTime` upgrades to "2 minutes ago" only after hydration (via `useSyncExternalStore`) to avoid mismatches. Theme has two stores — `UserPreferences.theme` is authoritative, `localStorage` is the paint-blocking cache read by the inline script in `app/layout.tsx`; `useSyncedTheme` writes localStorage first, then the DB.

### Route ↔ layout composition

Each route in `app/` is a thin composition of layout chrome + section components pulled from `components/`. There's no shared root layout beyond fonts/global CSS in `app/layout.tsx` — every page independently composes its own header + sidebar:

- `app/page.tsx` — the **public landing page**. Reads no session (it must stay renderable for
  anonymous visitors); `/` is public via `PUBLIC_EXACT` in `auth.config.ts`, which is separate
  from `PUBLIC_PREFIXES` because a `/` prefix would make every path public.
- `app/users/page.tsx` — the users table (`Header` + `IconSidebar` + `components/users/UsersTable`). This is the signed-in main screen; `DEFAULT_SIGNED_IN_PATH` in `auth.config.ts` points here and is the fallback for every `callbackUrl`.
- `app/account/{preferences,security,access-tokens,audit-logs}/page.tsx` — account section: `AccountHeader` + `SettingsSidebar` (from `components/account/`), with an `active` prop identifying the current nav item. There is **no** `app/account/layout.tsx`.
- `app/(auth)/{signin,signup}/page.tsx` — the only route group; gives auth pages a bare layout with no dashboard chrome without changing their URLs.

`app/layout.tsx` also wraps everything in `MobileNavProvider` → `SearchProvider` and renders `CommandPalette`, alongside the paint-blocking theme script.

`NoticeBanner` (dashboard) is rendered at the bottom of every page as a dismissible toast-like element.

### Component organization (by route family, not by type)

- `components/dashboard/` — app chrome (`Header`, `IconSidebar`, `AppLogo`, `CopyButton`, `NoticeBanner`).
- `components/users/` — the user-management screen (`UsersTable` server component; `UserFilters`, `UserRowActions`, `CreateUserDialog`, `ResetPasswordDialog` client leaves).
- `components/account/` — account/preferences pages (`AccountHeader`, `SettingsSidebar`, plus each settings section as its own component: `ProfileInformation`, `SignInMethods`, `Connections`, `AppearanceSettings`, `KeyboardShortcuts`, `DashboardSettings`, `AnalyticsMarketing`, `DangerZone`, `SecuritySettings`, `AccessTokensTable`, `AuditLogsTable`). `SettingsPrimitives.tsx` exports the shared `SectionHeading` / `SettingsCard` / `SettingsRow` building blocks used across the settings sections, and `Switch.tsx` is the shared toggle control (supports controlled `checked` + `onCheckedChange` as well as uncontrolled `defaultChecked`).
- `components/auth/` — sign-in/sign-up forms and their shared `AuthPrimitives`, plus `GoogleButton`.
- `components/layout/` — mobile navigation: `MobileNavProvider` (context), `MobileMenuButton`, `MobileDrawer`.
- `components/search/` — the ⌘K `CommandPalette`, its `SearchProvider` and `SearchTrigger`. `search-data.ts` is a hardcoded nav list, not a live index.
- `components/theme/` — `useTheme` (reads) and `useSyncedTheme` (writes localStorage, then the DB).

When adding a new settings-style section, compose it from `SettingsPrimitives` (`SectionHeading` + `SettingsCard` + `SettingsRow`) rather than rebuilding card/row markup, to stay visually consistent with existing sections.

### Sidebar takes an `active` prop

`SettingsSidebar` takes a typed `active` union prop (`"Preferences" | "Access Tokens" | "Security" | "Audit Logs"`) to highlight the current nav item — pass the matching literal from the page that renders it.

### Naming / configuration conventions

The old `{{APP_NAME}}` / `{{APP_DOMAIN}}` template placeholders are gone. Product-agnostic copy reads `appName` / `appDomain` from **`lib/app-config.ts`** — import from there, never hardcode a name.

Two config modules, and the split matters:

- **`lib/app-config.ts`** — client-safe. `NEXT_PUBLIC_*` only, plain static `process.env.X` member access so Next inlines it at build time. Safe in Client Components.
- **`lib/env.ts`** — server only. Parses secrets with zod at import time and **throws** on anything missing or malformed, so a bad `.env` fails at boot rather than deep inside a query. **Never import it from a Client Component** — `DATABASE_URL` and `AUTH_SECRET` don't exist in the browser, so the parse would throw during hydration. It also validates the `NEXT_PUBLIC_*` names (required, and `APP_DOMAIN` must be a bare hostname) so a typo fails loudly instead of silently falling back to a default.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
