# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is pnpm (see `pnpm-lock.yaml` / `pnpm-workspace.yaml`); a `package-lock.json` also exists but should not be treated as authoritative.

- `pnpm dev` — start the Next.js dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — run ESLint (`eslint-config-next` core-web-vitals + typescript rules)
- `npx tsc --noEmit` — typecheck (no dedicated `typecheck` script exists)

There is no test suite/framework configured in this repo.

## Architecture

This is a **static, presentational admin-dashboard UI shell** — a reusable template intended to be the frontend layer for other projects, not a working application. There is no backend: no database, no auth, no API routes (`app/api/*` does not exist), no data fetching, and no state management. Buttons/forms are visually complete but not wired to any real submission logic (e.g. "Save" buttons are `disabled`, links are `href="#"`). Anyone building on this template is expected to bring their own backend and wire it into the existing components/props.

Next.js App Router (`app/`), React 19, Tailwind CSS v4 (via `@tailwindcss/postcss`, tokens defined in `app/globals.css` using `@theme inline`), `lucide-react` for icons.

### Route ↔ layout composition

Each route in `app/` is a thin composition of layout chrome + section components pulled from `components/`. There's no shared root layout beyond fonts/global CSS in `app/layout.tsx` — every page independently composes its own header + sidebar:

- `app/page.tsx` — main dashboard: `Header` + `IconSidebar` (from `components/dashboard/`) wrapping `ProjectOverview`, `RegionMapCard`, `UsageCharts`, `AdvisorPanel`, `ReportsPanel`.
- `app/account/preferences/page.tsx`, `app/account/audit-logs/page.tsx` — account section: `AccountHeader` + `SettingsSidebar` (from `components/account/`), with an `active` prop identifying the current nav item.
- `app/project/settings/page.tsx` — project settings: `Header` + `IconSidebar` + `ProjectSettingsSidebar` (from `components/project-settings/`), also using an `active` prop for nav state.

`NoticeBanner` (dashboard) is rendered at the bottom of every page as a dismissible toast-like element.

### Component organization (by route family, not by type)

- `components/dashboard/` — project-level dashboard chrome and widgets (`Header`, `IconSidebar`, `AppLogo`, `ProjectOverview`, `RegionMapCard`, `UsageCharts`, `AdvisorPanel`, `ReportsPanel`, `NoticeBanner`).
- `components/account/` — account/preferences pages (`AccountHeader`, `SettingsSidebar`, plus each settings section as its own component: `ProfileInformation`, `SignInMethods`, `Connections`, `AppearanceSettings`, `KeyboardShortcuts`, `DashboardSettings`, `AnalyticsMarketing`, `DangerZone`, `AuditLogsTable`). `SettingsPrimitives.tsx` exports the shared `SectionHeading` / `SettingsCard` / `SettingsRow` building blocks used across both `account/` and `project-settings/` sections, and `Switch.tsx` is the shared toggle control.
- `components/project-settings/` — project settings sections (`ProjectSettingsSidebar`, `GeneralSettingsForm`, `ProjectAccess`, `ProjectAvailability`, `ServiceVersions`, `CustomDomains`, `TransferProject`, `DeleteProject`).

When adding a new settings-style section, compose it from `SettingsPrimitives` (`SectionHeading` + `SettingsCard` + `SettingsRow`) rather than rebuilding card/row markup, to stay visually consistent with existing sections.

### Sidebars take an `active` prop

`SettingsSidebar` and `ProjectSettingsSidebar` both take a typed `active` union prop (e.g. `"Preferences" | "Access Tokens" | "Security" | "Audit Logs"`) to highlight the current nav item — pass the matching literal from the page that renders them.

### Placeholder conventions

Text that's meant to be filled in per-project (rather than genuinely blank) uses literal `{{TOKEN}}` placeholders, e.g. `{{APP_NAME}}` in `app/layout.tsx` metadata and account copy, `{{APP_DOMAIN}}` in `ProjectOverview.tsx`. Inside JSX children these are escaped as string literals (`{"{{APP_NAME}}"}`) since raw `{{...}}` is parsed as a JS expression by JSX. Preserve this pattern rather than hardcoding a real name when adding new copy that should stay project-agnostic.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
