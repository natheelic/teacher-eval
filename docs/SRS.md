# Software Requirements Specification

**Product:** ระบบประเมินผลการปฏิบัติงานครู — Teacher Performance Evaluation System
**Organization:** วิทยาลัยการอาชีพลอง (Long Industrial and Community Education College)
**Document version:** 2.0
**Status:** Target specification. The evaluation system is being built on top of the former
"Portal" user-management codebase; see the status markers below.
**Format:** IEEE Std 830-1998

> **Status markers.** A requirement with no marker describes behaviour that exists in the codebase
> today. **[PLANNED — Phase n]** marks a requirement that is specified but not yet implemented; the
> phase refers to [`ROADMAP.md`](./ROADMAP.md). **[BEING REPLACED — Phase n]** marks current
> behaviour that the named phase removes or changes. **[POLICY DEFAULT]** marks a business rule
> taken from the product brief's examples that HR has not yet confirmed (Appendix C); it must stay
> configurable. Each phase flips its markers when it lands.

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Overall description](#2-overall-description)
3. [Specific requirements](#3-specific-requirements)
4. [Appendices](#4-appendices)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements of the **Teacher
Performance Evaluation System** (ระบบประเมินผลการปฏิบัติงานครู), a web application with which the
HR department and evaluation committees of วิทยาลัยการอาชีพลอง evaluate teachers accurately,
transparently and quickly.

It is written for developers extending the system, reviewers assessing changes, HR staff
confirming policy, and automated coding agents (see [`../AGENTS.md`](../AGENTS.md)). It is the
authority on *what the system must do*; `AGENTS.md` is the authority on *how the codebase is
arranged*; [`PLAN.md`](./PLAN.md) is the original product brief; [`ROADMAP.md`](./ROADMAP.md) is the
delivery order.

### 1.2 Scope

**In scope**

- Authentication for staff accounts (email + password, optional Google, optional TOTP), with no
  public self-registration.
- Three roles — `ADMIN` (HR), `COMMITTEE`, `TEACHER` — with server-enforced, record-scoped access.
- Records: departments, teachers, committee members, committee groups.
- Evaluation rounds with a controlled lifecycle, a per-round configurable rubric (categories,
  criteria, score ranges, weights, comment rules) and configurable result bands.
- Assignment of one or more committee members to each teacher within a round.
- The committee evaluation form: scoring with validation, comments and evidence, draft, review,
  confirmed submission, and post-submit locking.
- HR monitoring, review, return/reopen, approval and finalization, with history.
- Multi-member score aggregation (average or weighted average).
- Teacher result view, printable A4 reports, CSV and Excel exports.
- Dashboards and charts, global search, in-app notifications, system settings.
- Carried over from the platform: device sessions, password reset, invitations, audit log,
  personal API tokens, preferences, admin email/branding settings.

**Explicitly out of scope**

- Public sign-up. Accounts are created by HR (FR-14).
- Server-side PDF rendering. "ดาวน์โหลด PDF" uses the browser's print-to-PDF on the A4 print
  page (FR-711).
- Importing data from the unrelated `public.teachers` / `public.committees` / `public.evaluations`
  / `public.profiles` tables that share the Supabase database. They belong to another application
  and must not be read or written.
- Production-readiness work of ROADMAP Phase 8: pilot round, HR sign-off, backup/restore
  rehearsal, data-retention and privacy review.
- Multi-tenancy (multiple colleges), billing, SAML/LDAP/WebAuthn.
- Appeals by teachers against a finalized result (not in the brief; Appendix C).

### 1.3 Definitions, acronyms and abbreviations

| Term | Definition |
|---|---|
| **HR / Admin** | A user with role `ADMIN`. Manages records, rounds, rubric, assignments, review and reports. |
| **Committee member** | A `CommitteeMember` record; when linked to a `User` with role `COMMITTEE`, that user can evaluate the teachers assigned to them. |
| **Teacher** | A `Teacher` record (the person being evaluated); when linked to a `User` with role `TEACHER`, that user can view their own finalized results. |
| **Round** | An `EvaluationRound`: an academic year (พ.ศ.) + round number, with dates, a status and its own rubric. |
| **Rubric** | The categories (ด้าน) and criteria (ตัวชี้วัด) of one round, plus its result bands. |
| **Assignment** | One committee member assigned to evaluate one teacher in one round. |
| **Evaluation** | The scoresheet one committee member fills in for one assignment. |
| **Teacher result** | The frozen, finalized outcome for one teacher in one round, aggregated over its evaluations. |
| **Result band** | A labelled percentage range, e.g. 90–100 = ดีเยี่ยม. |
| **Aggregation** | How several committee members' percentages combine into one teacher score. |
| **Actor / Target** | The authenticated user performing an operation / the user an administrative operation is performed upon. |
| **Device session** | A `DeviceSession` row representing one signed-in browser; distinct from Auth.js `Session`. |
| **`sid` / `uid`** | Device-session id / user id carried in the JWT. |
| **Server Action** | A Next.js `"use server"` function; this system's mutation mechanism. |
| **Audit action code** | A stable key such as `evaluation.submitted`, stored in `AuditLog.actionCode`. |
| **Workflow event** | A `WorkflowEvent` row recording a state transition of an evaluation or teacher result (who, when, why). |
| **พ.ศ.** | Buddhist Era year (CE + 543), the academic-year convention used throughout the UI. |

### 1.4 References

| Ref | Document |
|---|---|
| R1 | IEEE Std 830-1998, *Recommended Practice for Software Requirements Specifications* |
| R2 | [`PLAN.md`](./PLAN.md) — product brief (sections cited as PLAN §n) |
| R3 | [`ROADMAP.md`](./ROADMAP.md) — phased delivery plan |
| R4 | [`../AGENTS.md`](../AGENTS.md) — codebase architecture guide |
| R5 | Auth.js v5 — `next-auth@5.0.0-beta.32`; Prisma 7 — driver adapters and `prisma.config.ts` |
| R6 | Next.js 16 documentation, vendored at `node_modules/next/dist/docs/` |

### 1.5 Overview

Section 2 describes the product context, user classes and binding constraints. Section 3 states the
requirements. Platform requirements carried over from the previous product keep their original
identifiers (`FR-10` – `FR-95`) because code comments reference them; evaluation requirements use
`FR-100` and above, grouped by hundreds. Section 4 holds the environment contract, traceability
matrix and open policy questions/deviations.

---

## 2. Overall description

### 2.1 Product perspective

A self-contained web application (Next.js 16 App Router, React 19, Auth.js v5, Prisma 7) backed by
Supabase PostgreSQL. All application tables live in the dedicated Postgres schema **`portal`**,
isolated from the unrelated tables in `public`.

```
                 ┌──────────────────────────────┐
   Browser ─────▶│  proxy.ts   (redirect only)  │  sees the decoded JWT, never the DB
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  Server Components / Actions │
                 │  requireUser() / requireAdmin│  authorization + revocation enforced here
                 │  requireCommittee/Teacher()  │  record scoping by linked profile
                 └──────┬───────────────┬───────┘
                        ▼               ▼
              lib/scoring (pure)   lib/permissions (pure)
                        ▼
                 ┌──────────────────────────────┐
                 │ Prisma 7 + @prisma/adapter-pg │  schema "portal"
                 └──────────────┬───────────────┘
                                ▼
                     Supabase PostgreSQL
```

### 2.2 Product functions

| # | Function | Available to |
|---|---|---|
| F1 | Sign in, sign out, forgot password | All staff |
| F2 | Manage departments, teachers, committee members and groups | `ADMIN` |
| F3 | Create rounds, configure rubric and result bands, control round lifecycle | `ADMIN` |
| F4 | Assign committee members/groups to teachers | `ADMIN` |
| F5 | Score assigned teachers: draft, review, submit | `COMMITTEE` (own assignments only) |
| F6 | Monitor progress; approve, return, reopen; finalize results | `ADMIN` |
| F7 | View results with category breakdown and feedback | `ADMIN` (all); `TEACHER` (own, finalized) |
| F8 | Print A4 reports; export CSV/Excel | `ADMIN` (all); `TEACHER` (own report) |
| F9 | Dashboards and charts | All, role-specific content |
| F10 | Search, notifications | All, scoped to what the role may see |
| F11 | Manage user accounts and link them to teacher/committee records | `ADMIN` |
| F12 | System settings: college identity, logo, email, announcements | `ADMIN` |
| F13 | Own profile, password, 2FA, sessions, API tokens, audit log, theme | All |

### 2.3 User classes and characteristics

**[BEING REPLACED — Phase 1]** The code currently defines `Role` as `ADMIN | MANAGER | MEMBER |
VIEWER`. The target enum is:

| Role | Landing page | Capabilities | Typical user |
|---|---|---|---|
| `ADMIN` | `/dashboard` (HR dashboard) | Everything. The only role that manages records, rounds, rubric, assignments, users and settings, reviews and finalizes. | HR staff, deputy director |
| `COMMITTEE` | `/dashboard` (assigned work) | Sees and evaluates only the teachers assigned to their linked `CommitteeMember` in open rounds; sees only their own evaluations. | Department heads, senior teachers, external evaluators |
| `TEACHER` | `/dashboard` (own results) | Sees only their own profile and their own **finalized** results and reports. | Any evaluated teacher |

Users are mostly non-technical and use desktops, tablets and phones; committee members often score
on a phone or tablet. All UI copy is Thai.

A user also carries a `UserStatus`: `ACTIVE`, `INVITED`, or `SUSPENDED`.

### 2.4 Operating environment

| Component | Requirement |
|---|---|
| Runtime | A long-lived Node.js server (`pnpm start`). Logo/photo uploads and `/docs` read and write the local disk. |
| Database | Supabase PostgreSQL, schema `portal`, via the session pooler for CLI and the transaction pooler for the app. A local Docker Postgres (`docker-compose.yml`) remains an alternative for offline development. |
| Package manager | pnpm (`packageManager` field). `package-lock.json` is present but **not** authoritative. |
| Browser | Current Chrome, Edge, Safari, Firefox — desktop and mobile. Printing tested in Chrome/Edge. |

### 2.5 Design and implementation constraints

- **C-1** — `auth.config.ts` must remain edge-safe: no Prisma, no bcrypt.
- **C-2** — The Credentials provider forces `session.strategy: "jwt"`; the adapter `Session` table
  stays empty. The user-visible session list is `DeviceSession`, keyed by the JWT's `sid`.
- **C-3** — `proxy.ts` is a redirect layer only and is never an authorization boundary.
- **C-4** — `requireUser()` in `lib/auth/require-session.ts` is the single session boundary. Every
  protected page, Server Action and route handler calls it (directly or via `requireAdmin()`,
  `requireCommittee()`, `requireTeacher()`).
- **C-5** — `lib/env.ts` must never be imported from a Client Component.
- **C-6** — No product or college name is hardcoded in components; they come from `AppSettings`
  via `getAppSettings()` (FR-93, FR-803).
- **C-7** — Mutations are Server Actions. Route handlers are reserved for `[...nextauth]`, machine
  APIs, and file downloads (CSV/Excel exports).
- **C-8** — Prisma 7: the datasource URL lives in `prisma.config.ts`; the client is imported from
  `@/lib/prisma`, which passes the URL's `?schema=` value to the driver adapter explicitly.
- **C-9** — Next 16 renamed `middleware.ts` to `proxy.ts`.
- **C-10** — **[PLANNED — Phase 3]** Scoring logic lives in `lib/scoring/` as pure functions with
  no Prisma or request context, shared by the client (live preview) and server (authoritative
  totals). The server never trusts a client-supplied total.
- **C-11** — **[PLANNED — Phase 1]** Every evaluation query is scoped by the caller in the query
  itself (committee: `assignment.committeeMemberId = me`; teacher: `teacherId = me` and
  `finalized`), not filtered after fetching.
- **C-12** — Destructive schema changes are generated with `prisma migrate diff` and applied with
  `prisma migrate deploy` (no interactive `migrate dev` against Supabase; AGENTS.md).

### 2.6 Assumptions and dependencies

- **A-1** A database is reachable at boot. `lib/env.ts` resolves `DATABASE_URL`, then
  `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`; Prisma CLI prefers
  `POSTGRES_URL_NON_POOLING`. Supabase URLs carry `uselibpqcompat=true` (libpq `sslmode`
  semantics) and `schema=portal`.
- **A-2** Google OAuth is optional and enabled only when both `AUTH_GOOGLE_*` variables are set.
- **A-3** The deployment is trusted internally. Credentials sign-in and TOTP are rate-limited
  in-memory per process (`lib/auth/rate-limit.ts`); nothing else is.
- **A-4** Clock skew between application and database is negligible.
- **A-5** Email is optional. Without SMTP, invitations and password reset are unavailable and HR
  sets initial passwords instead (FR-40e).
- **A-6** HR will confirm the official rubric, bands, aggregation and visibility rules
  (Appendix C) before the first real round; until then the system ships the brief's examples as
  editable defaults.

---

## 3. Specific requirements

### 3.1 External interface requirements

#### 3.1.1 User interfaces

General: Thai UI, "Noto Sans Thai" typography, navy/blue/white with a restrained gold accent,
rounded cards, soft shadows, light and dark themes. Desktop: left sidebar. Mobile: hamburger drawer.
Header: college logo, college name, system title, notification bell, profile menu, sign-out.

| Route | Access | Content | Status |
|---|---|---|---|
| `/` | Public | Redirects to `/dashboard` (thus to `/signin` when signed out). | [PLANNED — Phase 1] (currently a public landing page) |
| `/signin` | Anonymous | Thai sign-in: logo, ยินดีต้อนรับ, system and college name, email, password, remember me, forgot password. | Exists; redesign [PLANNED — Phase 1] |
| `/signup` | — | Removed. | [BEING REPLACED — Phase 1] |
| `/forgot-password`, `/reset-password`, `/invite/accept`, `/verify-email`, `/account/set-password` | Anonymous / per flow | Unchanged platform flows. | Exists |
| `/dashboard` | All | Role-specific dashboard (FR-600, FR-610, FR-611). | [PLANNED — Phase 5] |
| `/teachers`, `/teachers/[id]` | `ADMIN` | Teacher management and profile/history. | [PLANNED — Phase 2] |
| `/committee` | `ADMIN` | Committee members and groups. | [PLANNED — Phase 2] |
| `/rounds`, `/rounds/[id]`, `/rounds/[id]/rubric`, `/rounds/[id]/bands` | `ADMIN` | Rounds, lifecycle, rubric and band editors. | [PLANNED — Phases 2–3] |
| `/assignments` | `ADMIN` | Round → teacher → committee assignment screen. | [PLANNED — Phase 3] |
| `/evaluate`, `/evaluate/[assignmentId]` | `COMMITTEE` | Assigned teachers; the evaluation form. | [PLANNED — Phase 4] |
| `/monitoring`, `/monitoring/[roundId]/[teacherId]` | `ADMIN` | Progress monitoring; review and finalize. | [PLANNED — Phase 5] |
| `/results`, `/results/[resultId]` | `ADMIN`; `TEACHER` (own) | Result list and detail. | [PLANNED — Phase 6] |
| `/reports`, `/reports/print/*`, `/reports/export/*` | `ADMIN`; `TEACHER` (own) | Report hub, A4 print pages, CSV/Excel downloads. | [PLANNED — Phase 6] |
| `/notifications` | All | Notification list. | [PLANNED — Phase 7] |
| `/settings/*` | `ADMIN` | College identity, departments, users & roles, email, announcements. Absorbs today's `/users` and `/admin/*`. | [PLANNED — Phase 1–2] |
| `/account/{preferences,security,access-tokens,audit-logs}` | All | Self-service account. | Exists |
| `/docs` | All signed-in | Renders this document. | Exists |

- **FR-01** — Each account page passes a literal from `"Preferences" | "Access Tokens" |
  "Security" | "Audit Logs"` as `SettingsSidebar`'s `active` prop.
- **FR-02** — The theme is applied before first paint by the inline script in `app/layout.tsx`.
- **FR-03** — Timestamps are rendered as absolute strings on the server and upgraded to relative
  form after hydration (`RelativeTime`). **[PLANNED — Phase 1]** Dates are shown in Thai with
  พ.ศ. years (e.g. 1 ตุลาคม 2569).

#### 3.1.2 Software interfaces

| Interface | Detail |
|---|---|
| Auth.js HTTP | `app/api/auth/[...nextauth]/route.ts`, `runtime = "nodejs"` |
| Google OAuth | Redirect URI `<origin>/api/auth/callback/google`; `allowDangerousEmailAccountLinking: false` |
| Database | Prisma 7 client over `@prisma/adapter-pg`, schema `portal` |
| Password hashing | `bcryptjs` |
| Token hashing | Node `crypto`, SHA-256 |
| Email | `nodemailer` over SMTP (optional) |
| Excel export | `exceljs` **[PLANNED — Phase 6]** |

#### 3.1.3 Communications interfaces

- **FR-04** — All state changes are Server Actions ending with `revalidatePath`. No REST/GraphQL
  mutation surface exists.
- **FR-05** — List filters are URL `searchParams` resolved on the server.

---

### 3.2 Functional requirements — platform (carried over)

#### FR-1x — Authentication

*`auth.ts`, `auth.config.ts`, `proxy.ts`, `lib/actions/auth.ts`.*

- **FR-10** — The system authenticates a user by email (case-insensitive) and password.
- **FR-11** — Password verification runs even when the account has no `passwordHash`, so timing
  does not disclose account existence.
- **FR-12** — Authentication is refused for any user whose `deletedAt` is set or whose status is
  `SUSPENDED`.
- **FR-13** — Google is offered as a provider if and only if both `AUTH_GOOGLE_*` variables are
  set; automatic email linking is disabled. **FR-13a** — A Google sign-in populates
  `firstName`/`lastName` from `given_name`/`family_name`. **FR-13b** — **[PLANNED — Phase 1]** A
  Google identity may only sign in to an account that already exists (created by HR, FR-40); it
  never creates a new account.
- **FR-14** — **[BEING REPLACED — Phase 1]** There is no public self-registration. `/signup`, its
  form and Server Action are removed. The first `ADMIN` is provisioned from the command line with
  `scripts/create-admin.mts`; every other account is created by an `ADMIN` (FR-40).
- **FR-15** — **[BEING REPLACED — Phase 1]** The current "first account to sign up becomes
  `ADMIN`" bootstrap in `lib/bootstrap.ts` is removed together with FR-14.
- **FR-16** — Usernames are derived from the email local part, slugified and disambiguated
  (`uniqueUsername()` in `lib/bootstrap.ts`, kept for FR-40 and scripts).
- **FR-16a** — `User.emailVerified` is stamped by a Google sign-in whose `email_verified` claim is
  true, and by invitation acceptance (FR-40b). Verification never gates use of the account.
- **FR-16b** — `/verify-email?token=<token>` consumes the token and stamps `emailVerified`.
- **FR-16c** — An unverified user may request a fresh verification email from
  `/account/preferences` when email is configured.
- **FR-16d** — `/forgot-password` returns the identical response whether or not the email matches
  an `ACTIVE` account (enumeration-safe); a match receives a 1-hour single-use reset link.
- **FR-16e** — `/reset-password?token=<token>` consumes the token, rehashes the password, revokes
  every `DeviceSession` of the account, and signs the user in. Audit:
  `account.password.reset_completed`.
- **FR-17** — Initial sign-in creates a `DeviceSession` and stamps `sid` and `uid` into the JWT.
- **FR-18** — Sessions expire after 30 days. **[PLANNED — Phase 1]** Unticking "จดจำฉันไว้"
  (remember me) limits the device session to 12 hours.
- **FR-19** — Signing out revokes the current `DeviceSession`; failure to revoke never blocks
  sign-out.
- **FR-20** — An unauthenticated request to a non-public path redirects to
  `/signin?callbackUrl=<path>`. **[PLANNED — Phase 1]** Public prefixes: `/signin`,
  `/forgot-password`, `/reset-password`, `/invite`, `/verify-email`, `/api`; exact: `/terms`.
- **FR-21** — An authenticated request to `/signin` redirects to `/dashboard`, also the fallback
  when no `callbackUrl` is given.
- **FR-22** — `callbackUrl` is sanitised so it cannot redirect off-site.
- **FR-23** — Failed credential authentication reports one message that never distinguishes an
  unknown email from a wrong password (Thai: "อีเมลหรือรหัสผ่านไม่ถูกต้อง").
- **FR-24** — On `trigger === "update"` the JWT callback refreshes name, email and picture.

#### FR-2x — Authorization (platform)

*`lib/permissions.ts` (pure), `lib/auth/require-session.ts`.*

- **FR-30** — `lib/permissions.ts` is the single source of truth for who may do what. It contains
  no Prisma access and no request context.
- **FR-31** — **[BEING REPLACED — Phase 1]** Only `ADMIN` reaches user administration and all HR
  surfaces (`requireAdmin()`). The `MANAGER`/`MEMBER`/`VIEWER` rank rules (formerly FR-33 –
  FR-36) are deleted with those roles.
- **FR-31a** — Navigation never presents links the current role cannot follow. Visibility is
  passed in by each page and defaults to hidden. **[PLANNED — Phase 7]** The ⌘K palette's static
  items are filtered by role too (closes D-16).
- **FR-32** — No user may act on themselves through user administration; self-service lives
  under `/account`.
- **FR-37** — The system refuses to demote, suspend or delete the final active `ADMIN`
  (`assertNotLastAdmin` in `lib/actions/users.ts`).
- **FR-38** — Every user-administration action resolves actor and target through the single gate
  `loadActionable(targetId)`.
- **FR-39** — `requireUser()` rejects a caller whose account is suspended or soft-deleted, or
  whose `DeviceSession` is revoked or expired — effective on the very next request.
- **FR-39a** — `requireUser()` redirects any caller without a `passwordHash` to
  `/account/set-password` (exempted via the proxy's `x-pathname` header).

#### FR-3x — User administration

*`lib/actions/users.ts`, `lib/queries/users.ts`. **[PLANNED — Phase 1]** moves to
`/settings/users`.*

- **FR-40** — An `ADMIN` creates a user by name, email and role (`ADMIN` | `COMMITTEE` |
  `TEACHER`). **[PLANNED — Phase 1]** A `COMMITTEE` or `TEACHER` user must be linked to exactly
  one existing, unlinked `CommitteeMember` or `Teacher` record respectively (FR-205, FR-215); the
  link may be set at creation or later. Duplicate email is rejected. Audit: `user.invited`.
- **FR-40a** — Invitation links are single-use, SHA-256-hashed in `VerificationToken`, and expire
  after 7 days (`lib/auth/verification-tokens.ts`).
- **FR-40b** — `/invite/accept?token=<token>` sets the password, flips `INVITED` → `ACTIVE`, stamps
  `emailVerified`, and signs the user in. Audit: `user.invitation.accepted`.
- **FR-40c** — Email-dependent features are gated on `await isEmailEnabled()`.
- **FR-40d** — An `ADMIN` may resend an invitation to a still-`INVITED` user. Audit:
  `user.invitation.resent`.
- **FR-40e** — **[PLANNED — Phase 1]** When email is not configured, the `ADMIN` instead sets an
  initial password (meeting `passwordSchema`) and the account is created `ACTIVE`; the password is
  never shown again. Audit: `user.invited` with `metadata.method = "password"`.
- **FR-41** — An `ADMIN` may change a user's role, subject to FR-32 and FR-37. Changing away from
  `COMMITTEE`/`TEACHER` clears the profile link. Audit: `user.role.changed`.
- **FR-42** — An `ADMIN` may suspend or reactivate a user; suspension revokes all device sessions
  in the same transaction. Audit: `user.suspended` / `user.reactivated`.
- **FR-43** — An `ADMIN` may reset a user's password, revoking all their device sessions. Audit:
  `user.password.reset`.
- **FR-44** — Deletion is a soft delete (`softDeleteUser()` in `lib/auth/deletion.ts`): set
  `deletedAt`, `SUSPENDED`, rewrite the email, null the username, delete OAuth `Account` rows.
  **[PLANNED — Phase 1]** It also clears the user's link to a `Teacher`/`CommitteeMember` record;
  the record itself and all evaluation history are retained. Audit: `user.deleted`.
- **FR-44a** — OAuth sign-in is refused for deleted or suspended accounts (`signIn()` callback).
- **FR-45 – FR-49** — The users list excludes soft-deleted users, supports text/role/status
  filters and 25-row cursor pagination, reports filtered `total` and unfiltered `stats`, never
  selects `passwordHash`, and calls its own guard.

#### FR-4x — Self-service account

*`lib/actions/{profile,security,connections,tokens,twoFactor}.ts`, `lib/queries/account.ts`.*

- **FR-50** — A user may update first name, last name and username (unique, 3–40 chars,
  `/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/`). Audit: `account.profile.updated`.
- **FR-51 – FR-53** — A user may link Google, may never unlink their last sign-in method, and an
  OAuth-only user may set a password without a current one.
- **FR-54** — Changing a password revokes every other device session in one transaction. Audit:
  `account.password.changed`.
- **FR-55 – FR-56** — A user sees and may revoke their own device sessions, scoped by `userId`.
- **FR-57 – FR-59c** — Personal API tokens: hashed storage, shown once, revocable, bearer
  authentication for `app/api/*`, chosen expiry and scopes from closed vocabularies.
- **FR-60 – FR-61a** — Self-requested account deletion with a 30-day grace period enforced lazily
  in `requireUser()`; signing in cancels a pending request.
- **FR-62** — Optional TOTP two-factor authentication on the Credentials path.

#### FR-5x — Preferences

- **FR-70** — A user may set theme `LIGHT` | `DARK` | `SYSTEM`; `UserPreferences.theme` is
  authoritative, `localStorage` is the paint-blocking cache.
- **FR-75** — Preference reads fall back to schema defaults when no row exists.

#### FR-6x — Audit

*`lib/audit.ts`, `lib/queries/audit.ts`, `lib/action-codes.ts`.*

- **FR-80** — Every security-relevant **and every evaluation-workflow** operation writes one
  `AuditLog` row with actor, Thai human-readable `action`, machine `actionCode`, optional target,
  IP and user-agent.
- **FR-81** — Auditing never causes a user-visible operation to fail.
- **FR-82** — `targetLabel` is denormalised; user FKs are `SetNull`.
- **FR-83 – FR-84a** — Range, scope, action-code and target filters with cursor pagination.
  **[PLANNED — Phase 1]** `scope=all` is permitted to `ADMIN` only.
- **FR-85** — `actionCode` is drawn from the closed `ACTION_CODES` vocabulary. **[PLANNED]** It
  gains the evaluation codes listed in FR-890.
- **FR-86 – FR-87** — Expandable row detail; CSV export of the filtered log (≤5,000 rows) via
  `app/account/audit-logs/export/route.ts`.

#### FR-9x — Feedback and admin settings

- **FR-90** — Signed-in users can submit free-text feedback; `ADMIN`s read it.
- **FR-91** — An `ADMIN` may upload a PNG/JPEG/WebP logo (≤2MB, no SVG) stored under
  `public/uploads`; removing it restores the default.
- **FR-92** — An `ADMIN` may publish, edit or deactivate one dismissible announcement.
- **FR-93** — An `ADMIN` may change the displayed application name (`AppSettings.appName`). The
  TOTP issuer deliberately keeps the build-time name.
- **FR-94 – FR-94b** — Runtime SMTP configuration with an encrypted password, provider presets
  resolved server-side, and a test-send.
- **FR-95** — **[BEING REPLACED — Phase 1]** The `/admin/*` sub-routes move under `/settings/*`
  with the same `ADMIN` guard and persistent sub-navigation.

---

### 3.3 Functional requirements — evaluation system

All requirements in this section are **[PLANNED]** for the phase in their heading unless marked
otherwise.

#### FR-1xx — Identity, access and navigation (Phase 1)

- **FR-100** — The application presents the college identity (logo, "วิทยาลัยการอาชีพลอง", "ระบบ
  ประเมินผลการปฏิบัติงานครู") on the sign-in page, in the header, and on every report.
- **FR-101** — `Role` is `ADMIN | COMMITTEE | TEACHER` (§2.3).
- **FR-102** — `requireCommittee()` returns the caller's linked, active `CommitteeMember` or
  redirects to `/dashboard` with an explanatory state; `requireTeacher()` does the same for
  `Teacher`. A `COMMITTEE`/`TEACHER` user without a linked record sees a "บัญชียังไม่ได้เชื่อมโยง
  กับข้อมูลบุคลากร กรุณาติดต่อฝ่ายบุคคล" page and nothing else.
- **FR-103** — Pure permission functions in `lib/permissions.ts`: `canManageSystem(role)`,
  `canEvaluate(member, assignment, round)`, `canEditEvaluation(status, roundStatus)`,
  `canViewEvaluation(viewer, evaluation)`, `canViewResult(viewer, result)`. Each is unit-tested
  for allowed and denied combinations.
- **FR-104** — Navigation (PLAN §25), filtered by role:
  `ADMIN`: แดชบอร์ด, ข้อมูลครู, คณะกรรมการ, รอบการประเมิน, มอบหมายกรรมการ, ติดตามการประเมิน, ผลการ
  ประเมิน, รายงานและสถิติ, การแจ้งเตือน, ตั้งค่าระบบ.
  `COMMITTEE`: แดชบอร์ด, แบบประเมิน, การแจ้งเตือน.
  `TEACHER`: แดชบอร์ด, ผลการประเมิน, การแจ้งเตือน.
  All roles also reach the account pages from the profile menu.
- **FR-105** — Unauthorized access to a record (wrong role, or another user's record by URL
  tampering) returns the standard not-found page — never the record, and never a message that
  confirms the record exists.
- **FR-106** — Every page offers loading, empty and error states in Thai.

#### FR-2xx — Core records (Phase 2)

*Departments*

- **FR-200** — An `ADMIN` can create, rename and deactivate departments (code unique, Thai name).
  A department with teachers cannot be deleted, only deactivated. Default list from PLAN §26.

*Teachers*

- **FR-201** — A teacher record holds: staff code (unique), prefix (นาย/นาง/นางสาว/other), first
  name, last name, position, academic rank (วิทยฐานะ), department, phone, email, profile photo,
  employment type (ข้าราชการ, พนักงานราชการ, ครูอัตราจ้าง, other), active flag, optional linked user.
- **FR-202** — `/teachers` lists teachers with code, photo, full name, position, department,
  academic rank, current-round status (PLAN §6); free-text search over name/code; filters for
  department, position, academic rank, round, status, active. On narrow screens rows become
  cards.
- **FR-203** — An `ADMIN` can add and edit teachers. Required fields are validated; duplicate
  staff codes are rejected with a field error. Audit: `teacher.created` / `teacher.updated`.
- **FR-204** — Teachers are deactivated, not deleted, once referenced by any assignment;
  deactivated teachers cannot receive new assignments. A never-assigned teacher may be deleted.
  Audit: `teacher.deactivated` / `teacher.reactivated` / `teacher.deleted`.
- **FR-205** — `/teachers/[id]` shows the profile and evaluation history across rounds.
- **FR-206** — Profile photos reuse the logo validation (PNG/JPEG/WebP, ≤2MB, no SVG).

*Committee*

- **FR-210** — A committee-member record holds: code (unique), prefix, first name, last name,
  position, department/organization, phone, email, active flag, optional linked user.
- **FR-211** — `/committee` lists, searches, adds, edits and (de)activates members with the same
  rules as FR-203 – FR-204. Audit: `committee.member.*`.
- **FR-212** — An `ADMIN` can create committee groups ("คณะกรรมการชุดที่ 1") and add members with
  a group role: ประธานกรรมการ (CHAIR), กรรมการ (MEMBER), กรรมการและเลขานุการ (SECRETARY). A
  group has at most one chair. Groups are templates for assignment (FR-402). Audit:
  `committee.group.*`.
- **FR-215** — A `CommitteeMember` or `Teacher` may be linked to at most one user, and a user to
  at most one record (unique constraints).

#### FR-3xx — Rounds, rubric and result bands (Phases 2–3)

*Rounds (Phase 2)*

- **FR-300** — A round holds academic year (พ.ศ.), round number, title, description, start and end
  dates, status, and aggregation method. `(academicYear, roundNo)` is unique; end ≥ start.
- **FR-301** — Status lifecycle `DRAFT → OPEN → IN_PROGRESS → CLOSED → FINALIZED`, with only
  these transitions:
  - `DRAFT → OPEN`: requires ≥1 category with ≥1 criterion, a valid band set (FR-321), and is
    confirmed by the `ADMIN`.
  - `OPEN → IN_PROGRESS`: automatic on the first saved draft in the round.
  - `OPEN | IN_PROGRESS → CLOSED`: manual; closes scoring (no further drafts or submissions).
  - `CLOSED → IN_PROGRESS`: manual reopen with a reason.
  - `CLOSED → FINALIZED`: only when every assigned teacher has a finalized result (FR-520).
  - A `FINALIZED` round is read-only. Audit: `round.status.changed` with from/to/reason.
- **FR-302** — An `ADMIN` can create, edit (while `DRAFT`) and list rounds; the current round is
  the most recent non-`DRAFT`, non-`FINALIZED` round, else the latest round.

*Rubric (Phase 3)*

- **FR-310** — Each round owns its rubric: ordered **categories** (code e.g. "ด้านที่ 1", name,
  description) containing ordered **criteria** (title, indicators/รายละเอียดตัวชี้วัด,
  evaluation instructions, minimum score, maximum score, weight, comment rule).
- **FR-311** — Comment rule per criterion: `NONE` (optional), `REQUIRED`, or `REQUIRED_BELOW`
  with a threshold score below which a comment is required.
- **FR-312** — Validation: `0 ≤ min < max`; weight > 0; scores allow at most one decimal place
  (step 0.5 by default); category and criterion order unique within the parent; a round's total
  weighted maximum is shown live while editing.
- **FR-313** — The rubric is editable only while the round is `DRAFT`. From `OPEN` onward it is
  frozen — this per-round copy is the rubric snapshot/version that every evaluation in the round
  is scored against. Corrections after opening require closing the round and creating a new
  round (documented correction process; no silent edits).
- **FR-314** — An `ADMIN` can start a rubric from the built-in template (PLAN §11's five
  categories, 100 points) or by copying another round's rubric and bands. Audit: `rubric.*`.

*Result bands (Phase 3)*

- **FR-320** — Each round has an ordered set of result bands (minimum percent, Thai label, color
  tone). **[POLICY DEFAULT]** 90 ดีเยี่ยม, 80 ดีมาก, 70 ดี, 60 พอใช้, 0 ต้องปรับปรุง.
- **FR-321** — Bands must start at 0, have strictly increasing distinct minimums ≤ 100, and
  non-empty labels, so every percentage resolves to exactly one band.
- **FR-322** — Bands are editable until the round is `FINALIZED`; finalized results store the
  band label they were finalized with (FR-521).

#### FR-4xx — Assignments (Phase 3)

- **FR-400** — An `ADMIN` assigns one or more active committee members to an active teacher
  within a non-`FINALIZED` round, each with a role (chair/member/secretary) and a weight
  (default 1, used by weighted aggregation).
- **FR-401** — `(round, teacher, committee member)` is unique; inactive members/teachers and
  out-of-round assignments are rejected server-side.
- **FR-402** — Assigning a committee group creates one assignment per active group member with
  their group role, skipping ones that already exist.
- **FR-403** — `/assignments?round=` shows, per teacher: department, assigned members with roles,
  and per-member evaluation status; filters by department, committee member, group, and
  "unassigned". Supports add, remove and change (role/weight).
- **FR-404** — An assignment whose evaluation is `SUBMITTED` or later cannot be removed; the
  `ADMIN` must cancel the evaluation first (FR-512), which keeps its history.
- **FR-405** — Creating an assignment notifies the committee member's linked user (FR-810).
  Audit: `assignment.created` / `assignment.updated` / `assignment.removed`.

#### FR-5xx — Scoring and evaluation workflow (Phases 4–5)

*Committee scoring (Phase 4)*

- **FR-500** — `/evaluate` lists the caller's assignments in non-`DRAFT` rounds, with teacher
  photo, name, department, status badge and completion progress, ordered "not started → draft →
  returned → submitted → approved". The dashboard shows "คุณยังมีครู N คนที่ยังไม่ได้ประเมิน".
- **FR-501** — `/evaluate/[assignmentId]` is reachable only by the assignment's committee member
  (C-11, FR-105). It shows, persistently visible, the teacher's photo, name, position,
  department, academic rank, the round, and the evaluator's name.
- **FR-502** — The form lists each category with its criteria: title, indicators, instructions,
  maximum score, score input, comment, evidence/notes. Score input accepts typed numbers and
  offers large touch targets (± steppers and, for ranges of ≤10 steps, quick-pick buttons).
- **FR-503** — A score outside `[min, max]`, or with more precision than allowed, is rejected
  inline on the client and **rejected by the server**; it is never persisted.
- **FR-504** — The form shows, live: each category's score and maximum, overall score, overall
  maximum, percentage, and result band (PLAN §10), computed with the same `lib/scoring` code the
  server uses.
- **FR-505** — Scoring formulas (PLAN §12), with weight *wᵢ* (default 1):
  - criterion contribution = *scoreᵢ × wᵢ*; criterion maximum = *maxᵢ × wᵢ*
  - category score = Σ contributions in the category; category maximum = Σ maxima
  - overall score = Σ category scores; overall maximum = Σ category maxima
  - percentage = overall score ÷ overall maximum × 100
  - stored and displayed values are rounded half-up to 2 decimals **after** summation.
- **FR-506** — "บันทึกร่าง" saves a partial evaluation (blank scores allowed; invalid scores not)
  and creates the `Evaluation` (status `DRAFT`) on first save. Drafts resume exactly where left.
- **FR-507** — Concurrent edits are detected with an optimistic `version`: a save based on a
  stale version is rejected with "ข้อมูลถูกแก้ไขจากที่อื่น กรุณาโหลดหน้าใหม่" and nothing is
  overwritten.
- **FR-508** — Submitting first validates on the server: every criterion scored, every score in
  range, required comments present (FR-311), assignment belongs to the caller, round accepts
  submissions, and the teacher/round/committee match the assignment. Failures return the list of
  offending criteria, which the form highlights and links to, with "กรุณากรอกคะแนนให้ครบทุกข้อ
  ก่อนส่งแบบประเมิน".
- **FR-509** — A review step shows the summary, then the confirmation dialog "ยืนยันการส่งแบบ
  ประเมินหรือไม่?" / "เมื่อส่งแล้วจะไม่สามารถแก้ไขข้อมูลได้จนกว่า HR จะเปิดให้แก้ไขอีกครั้ง" with
  buttons "ยกเลิก" and "ยืนยันการส่ง".
- **FR-510** — Submission is atomic and idempotent: a conditional update succeeds only from
  `DRAFT` or `RETURNED` at the expected version; a repeated or concurrent submit changes nothing
  and reports the current state. On success the server stores computed totals, sets
  `SUBMITTED`, records a workflow event, notifies `ADMIN`s, and shows a confirmation screen.
- **FR-511** — A submitted evaluation is read-only to the committee member. Any write to it is
  rejected server-side regardless of the UI.

*HR review (Phase 5)*

- **FR-512** — Per evaluation, an `ADMIN` may: **approve** (`SUBMITTED → APPROVED`); **return
  for correction** (`SUBMITTED | APPROVED → RETURNED`, reason required — the committee member
  can edit and resubmit); **cancel** (`any → CANCELLED`, reason required — excluded from
  aggregation). Each records a workflow event and an audit row and notifies the affected
  committee member.
- **FR-513** — Every transition is recorded as a `WorkflowEvent` (actor, time, from, to, reason).
  Submitted scores are never deleted; a returned evaluation keeps its values for editing, and the
  event history shows every submission's totals.

*Aggregation and finalization (Phase 5)*

- **FR-520** — A teacher's result in a round can be finalized when every non-cancelled
  evaluation for that teacher is `APPROVED` and there is at least one.
- **FR-521** — Finalizing computes, server-side, the final percentage from the eligible
  (`APPROVED`) evaluations using the round's aggregation method, resolves the band, and writes a
  `TeacherResult` snapshot: final score, maximum, percentage, band label, per-category averages,
  finalized-by, finalized-at. Audit: `result.finalized`.
- **FR-522** — Aggregation methods: **[POLICY DEFAULT]** `AVERAGE` — arithmetic mean of the
  members' percentages (PLAN §13: (88 + 91 + 90) / 3); `WEIGHTED_AVERAGE` — mean weighted by each
  assignment's weight. Category breakdowns aggregate the same way per category.
- **FR-523** — An `ADMIN` may un-finalize a result (reason required) while the round is not
  `FINALIZED`; this reverts the teacher to "awaiting approval" and keeps the event history. Audit:
  `result.unfinalized`.
- **FR-524** — Derived teacher status in a round: ยังไม่เริ่ม (no evaluation started), กำลังประเมิน
  (any draft/returned, or some members not yet submitted), รอตรวจสอบ (all non-cancelled
  evaluations submitted, not all approved), อนุมัติแล้ว (finalized). Evaluation-level badges:
  ยังไม่เริ่ม (gray), บันทึกร่าง (blue), ส่งแล้ว/รอตรวจสอบ (orange), แก้ไข (red), อนุมัติแล้ว
  (green), ยกเลิก (gray, struck).

#### FR-6xx — Monitoring and dashboards (Phase 5)

- **FR-600** — The `ADMIN` dashboard shows cards for the current round: teachers evaluated
  (จำนวนครูที่ประเมิน), committee members, current round, completed, in progress, not started,
  awaiting review — large numbers with short labels.
- **FR-601** — Charts (simple SVG, readable in both themes, each with a text alternative):
  completion donut, status distribution, department average comparison, score distribution by
  band, monthly submissions.
- **FR-602** — Department summary table: แผนกวิชา | จำนวนครู | ประเมินแล้ว | กำลังประเมิน |
  ยังไม่เริ่ม | คะแนนเฉลี่ย.
- **FR-603** — Recent activity lists the latest workflow events in Thai sentences.
- **FR-604** — `/monitoring?round=` lists Teacher | Department | Committee | Progress (submitted
  ÷ assigned, as a bar) | Score | Status, filterable by department, status, committee member and
  the quick filters "ยังไม่ได้ประเมิน", "กรรมการยังไม่ส่ง", "ประเมินไม่ครบ", "รออนุมัติ".
- **FR-605** — `/monitoring/[roundId]/[teacherId]` shows each member's scores and comments per
  criterion, the running average, submitted/outstanding counts, the rubric, the event history,
  and the FR-512/FR-521/FR-523 actions.
- **FR-606** — Every dashboard figure is computed from persisted records with the same queries as
  the monitoring table, so the two always reconcile.
- **FR-610** — The `COMMITTEE` dashboard shows the caller's assignment counts by status and the
  FR-500 list.
- **FR-611** — The `TEACHER` dashboard shows the caller's profile and their finalized results by
  round.

#### FR-7xx — Results, reports and exports (Phase 6)

- **FR-700** — `/results/[resultId]` ("ผลการประเมินผลการปฏิบัติงานครู") shows teacher details,
  total score, maximum, percentage, band, a category breakdown table (หมวด | คะแนนเต็ม | คะแนน
  ที่ได้ | ร้อยละ) with a simple bar chart, and committee feedback.
- **FR-701** — A `TEACHER` can open only their own results, and only once finalized.
  **[POLICY DEFAULT]** Teachers see committee comments attributed by committee role, not by name;
  per-member scores are hidden from teachers.
- **FR-702** — `/results` lists results for the `ADMIN` (filters: year, round, department,
  position, rank, band, status) and the caller's own results for a `TEACHER`.
- **FR-710** — A4 print pages (`/reports/print/...`) for: individual teacher report, department
  report, overall round report, committee report, score summary. Each contains the college logo
  and name, system title, round, teacher and committee information, rubric, per-member and
  category scores, total, percentage, band, committee comments, and the signature block of PLAN
  §17 (one line per assigned member with their role, plus วันที่). Print CSS: white background,
  black text, thin borders, formal spacing, no application chrome, page breaks between teachers,
  repeated table headers.
- **FR-711** — Buttons on result and report pages: "พิมพ์รายงาน" (print), "ดาวน์โหลด PDF" (opens the
  print page and triggers print, from which the browser saves a PDF), "ส่งออก Excel", "ส่งออก CSV".
- **FR-712** — CSV (UTF-8 with BOM so Excel renders Thai) and XLSX exports for the same five
  report types, as session-gated route handlers under `app/reports/export/` (not `app/api/`).
- **FR-713** — Reports and exports apply exactly the authorization of FR-701/C-11; a `TEACHER`
  may export only their own individual report. Changing an id or query parameter never widens
  access (FR-105). Exported totals equal the stored `TeacherResult`/evaluation totals.

#### FR-8xx — Search, notifications and settings (Phases 1, 7)

- **FR-800** — The ⌘K palette and the header search find teachers (name, staff code),
  departments and committee members, scoped to what the caller may see: everything for `ADMIN`,
  assigned teachers for `COMMITTEE`, nothing beyond self for `TEACHER`.
- **FR-801** — List filters available across screens: academic year, round, department,
  position, academic rank, status, committee.
- **FR-810** — In-app notifications are created in the same transaction as the event they
  describe: new assignment (to the member), evaluation returned/reopened (to the member),
  evaluation submitted (to `ADMIN`s), all evaluations for a teacher submitted (to `ADMIN`s),
  result finalized (to the teacher). No notification is sent for an action that did not complete.
- **FR-811** — The header bell shows the unread count; `/notifications` lists notifications with
  links to their subject, and supports mark-as-read and mark-all-as-read. Notifications are
  private to their recipient.
- **FR-803** — `/settings` lets an `ADMIN` configure without code changes: college name (Thai,
  English), system title, logo, departments, users and roles, email, announcements, and links to
  per-round rubric, bands and aggregation (PLAN §29).
- **FR-890** — New audit action codes (added to `lib/action-codes.ts` before use):
  `department.*`, `teacher.*`, `committee.member.*`, `committee.group.*`, `round.created`,
  `round.updated`, `round.status.changed`, `rubric.updated`, `bands.updated`,
  `assignment.created`, `assignment.updated`, `assignment.removed`, `evaluation.draft_saved` (first
  save only), `evaluation.submitted`, `evaluation.approved`, `evaluation.returned`,
  `evaluation.cancelled`, `result.finalized`, `result.unfinalized`, `settings.college.updated`.

#### FR-9xx — Demo data (Phase 1 onward)

- **FR-900** — `scripts/seed-demo.mts` populates development data: the seven departments of PLAN
  §26, ≥8 teachers, ≥5 committee members in two groups, round 2569/1 "การประเมินผลการปฏิบัติงาน
  ครู" (1 ตุลาคม 2569 – 31 มีนาคม 2570) with the template rubric and default bands, and mixed
  statuses (not started, draft, submitted, returned, approved, finalized), plus demo accounts for
  each role.
- **FR-901** — The seed is idempotent, refuses to run when `NODE_ENV=production`, and requires an
  explicit `--yes`. `prisma/seed.ts` remains a no-op counter.

---

### 3.4 Non-functional requirements

#### Security

- **NFR-01** — Passwords are stored only as bcrypt hashes.
- **NFR-02** — Password verification runs even when no hash exists (FR-11).
- **NFR-03** — API tokens are stored only as SHA-256 hashes.
- **NFR-04** — Every page, query, action, report and export re-verifies authorization on the
  server. Hiding a control is never the control.
- **NFR-05** — Operations on subordinate or scoped objects (sessions, tokens, assignments,
  evaluations, results, notifications) are scoped in the query itself.
- **NFR-06** — Revocation takes effect on the next request.
- **NFR-07** — User-derived redirect targets are sanitised.
- **NFR-08** — Authentication errors never disclose account existence.
- **NFR-09** — **[PLANNED — Phase 4]** Client-submitted totals, percentages, statuses and
  teacher/committee/round identifiers are never trusted; the server derives them from the
  assignment and persisted scores.

#### Reliability and integrity

- **NFR-10** — Audit logging is best-effort and never propagates an exception.
- **NFR-11** — Multi-step changes with an invariant run in one transaction (suspension +
  revocation, submission + totals + event + notification, finalization + snapshot + event).
- **NFR-12** — Device-session creation tolerates missing request headers.
- **NFR-13** — **[PLANNED]** Referential integrity and uniqueness (staff codes, round
  year/number, assignments, one evaluation per assignment, one result per teacher/round) are
  enforced by database constraints, not only application checks.
- **NFR-14** — **[PLANNED]** Score columns use exact decimals (`Decimal`), never floating point.

#### Maintainability

- **NFR-20** — Server shell owns layout and copy; a small client leaf owns interactivity.
- **NFR-21** — Settings-style sections compose `SettingsPrimitives`.
- **NFR-22** — Components are organised by route family.
- **NFR-23** — Reads in `lib/queries/*` (`React.cache`d); mutations in `lib/actions/*`.
- **NFR-24** — The codebase passes `pnpm lint`, `pnpm typecheck` and `pnpm build`.
- **NFR-25** — Automated tests run with Vitest (`pnpm test`). **[PLANNED]** Scoring
  (boundaries, weights, rounding, missing values, aggregation, bands) and permissions
  (cross-role and cross-record denial) have unit-test coverage before their phase is complete.

#### Portability and configuration

- **NFR-30** — A malformed server environment fails at boot (`lib/env.ts`).
- **NFR-31** — Client-safe configuration is limited to statically accessed `NEXT_PUBLIC_*`.
- **NFR-32** — `NEXT_PUBLIC_APP_DOMAIN` is validated as a bare hostname.

#### Usability and accessibility

- **NFR-40** — Light and dark themes, applied before first paint.
- **NFR-41** — Usable from 360 px wide upward; the sidebar becomes a hamburger drawer; data tables
  become cards where necessary; touch targets are ≥44 × 44 px on the evaluation form.
- **NFR-42** — ⌘K command palette (FR-800).
- **NFR-43** — **[PLANNED — Phase 1]** Thai UI throughout with "Noto Sans Thai"; numbers use
  Arabic digits; years in พ.ศ.
- **NFR-44** — **[PLANNED]** Form controls have visible labels, errors are announced
  (`aria-invalid`, toast), colors are never the only status signal (badges carry text), and
  contrast meets WCAG 2.1 AA.
- **NFR-45** — **[PLANNED — Phase 4]** A committee member can open a teacher, score, review and
  submit without leaving the evaluation page.

---

### 3.5 Data requirements

Defined in `prisma/schema.prisma`, Postgres schema `portal`. Ids are cuids.

**Platform models (exist):** `User`, `Account`, `Session` (always empty, C-2),
`VerificationToken` (invitation/verification/reset tokens), `UserPreferences` (`theme` only),
`DeviceSession`, `ApiToken`, `AuditLog`, `AppSettings` (singleton), `Feedback`, `Announcement`.

**Evaluation models [PLANNED — Phases 1–7]:**

| Model | Key fields | Constraints / notes |
|---|---|---|
| `Department` | code, name, active | `code` unique |
| `Teacher` | staffCode, prefix, firstName, lastName, position, academicRank, departmentId, phone, email, photoUrl, employmentType, active, userId? | `staffCode` unique; `userId` unique; department `Restrict` |
| `CommitteeMember` | code, prefix, firstName, lastName, position, organization, phone, email, active, userId? | `code` unique; `userId` unique |
| `CommitteeGroup` | name, active | — |
| `CommitteeGroupMember` | groupId, memberId, role | unique(groupId, memberId) |
| `EvaluationRound` | academicYear, roundNo, title, description, startDate, endDate, status, aggregation | unique(academicYear, roundNo) |
| `EvaluationCategory` | roundId, order, code, name, description | unique(roundId, order); cascade with round while `DRAFT` only (app-enforced) |
| `EvaluationCriterion` | categoryId, order, title, indicators, instructions, minScore, maxScore, weight, commentRule, commentThreshold? | unique(categoryId, order); scores `Decimal(6,2)` |
| `ResultBand` | roundId, minPercent, label, tone | unique(roundId, minPercent) |
| `Assignment` | roundId, teacherId, committeeMemberId, memberRole, weight, createdById | unique(roundId, teacherId, committeeMemberId) |
| `Evaluation` | assignmentId, status, version, overallComment, submittedAt, totalScore?, maxScore?, percent? | `assignmentId` unique |
| `EvaluationScore` | evaluationId, criterionId, score?, comment, evidence | unique(evaluationId, criterionId) |
| `TeacherResult` | roundId, teacherId, finalScore, maxScore, percent, bandLabel, categoryBreakdown (JSON), finalizedAt, finalizedById | unique(roundId, teacherId) |
| `WorkflowEvent` | evaluationId?, teacherResultId?, roundId, actorId, type, fromStatus?, toStatus?, reason?, metadata, createdAt | append-only |
| `Notification` | userId, type, title, body, href, readAt?, createdAt | indexed (userId, readAt) |

`AppSettings` gains `collegeNameTh`, `collegeNameEn`, `systemTitle`.

**Enumerations**

```
Role               ADMIN | COMMITTEE | TEACHER          (currently ADMIN | MANAGER | MEMBER | VIEWER)
UserStatus         ACTIVE | INVITED | SUSPENDED
ThemeMode          LIGHT | DARK | SYSTEM
EmploymentType     CIVIL_SERVANT | GOVERNMENT_EMPLOYEE | CONTRACT | OTHER
CommitteeRole      CHAIR | MEMBER | SECRETARY
RoundStatus        DRAFT | OPEN | IN_PROGRESS | CLOSED | FINALIZED
AggregationMethod  AVERAGE | WEIGHTED_AVERAGE
CommentRule        NONE | REQUIRED | REQUIRED_BELOW
EvaluationStatus   DRAFT | SUBMITTED | RETURNED | APPROVED | CANCELLED
WorkflowEventType  DRAFT_STARTED | SUBMITTED | APPROVED | RETURNED | CANCELLED | FINALIZED | UNFINALIZED | ROUND_STATUS_CHANGED
```

"Not started" is the absence of an `Evaluation` row for an assignment, not a stored status.

- **DR-01** — `User.email` and `User.username` are unique; soft delete preserves both.
- **DR-02** — `AuditLog` and `WorkflowEvent` are append-only for application code.
- **DR-03** — `UserStatus.INVITED` is written only by `createUser()` and cleared only by
  `acceptInvitation()`.
- **DR-04** — `User.lastLoginAt` is stamped on every successful sign-in.
- **DR-05** — **[NOT ENFORCED]** Recommended 365-day `AuditLog` retention; no job infrastructure.
  Evaluation records are retained indefinitely pending the college's retention policy (Phase 8).
- **DR-06** — **[PLANNED]** Relationships follow Teacher → Round → Assignment → Evaluation →
  Criterion scores → comments (PLAN §21); comments and evidence live on `EvaluationScore` and
  `Evaluation.overallComment`, not in a separate table, to avoid duplication.
- **DR-07** — **[PLANNED]** Evaluation and result data are never hard-deleted once submitted;
  cancellation and deactivation are status changes.

**Migrations**: see `prisma/migrations/`. The role replacement and evaluation models arrive in one
hand-checked migration in Phase 1–2 (C-12).

---

## 4. Appendices

### Appendix A — Environment contract

| Variable | Required | Consumer | Notes |
|---|---|---|---|
| `DATABASE_URL` | One DB URL required | `prisma.config.ts`, `lib/prisma.ts` | Overrides `POSTGRES_*` |
| `POSTGRES_PRISMA_URL` | 〃 | `lib/env.ts` | Supabase transaction pooler (6543), `pgbouncer=true`; app runtime |
| `POSTGRES_URL` | 〃 | `lib/env.ts` | App fallback |
| `POSTGRES_URL_NON_POOLING` | 〃 | `prisma.config.ts` | Session pooler (5432); Prisma CLI |
| *(URL params)* | ✅ on Supabase | pg / Prisma | `uselibpqcompat=true` (libpq `sslmode=require` semantics, so the pooler's certificate chain is accepted) and `schema=portal` |
| `SHADOW_DATABASE_URL` | — | `prisma.config.ts` | Only for `migrate diff --from-migrations`; not needed when diffing schema files |
| `AUTH_SECRET` | ✅ | Auth.js, `lib/secret-box.ts` | Rotating it invalidates 2FA secrets and the stored SMTP password |
| `AUTH_URL` | Production | Auth.js | Required for `pnpm start` (otherwise `UntrustedHost`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | — | `auth.config.ts` | Both or neither |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_FROM` / `SMTP_USER` / `SMTP_PASS` | — | `lib/email-config.ts` | Bootstrap defaults; `/settings/email` wins |
| `NEXT_PUBLIC_APP_NAME` | ✅ | `lib/app-config.ts` | Fallback display name and TOTP issuer |
| `NEXT_PUBLIC_APP_DOMAIN` | ✅ | `lib/app-config.ts` | Bare hostname |
| `NODE_ENV` | — | `lib/env.ts`, `scripts/seed-demo.mts` | `production` disables the demo seed |

### Appendix B — Traceability matrix

| Requirements | Primary implementation | Status |
|---|---|---|
| FR-10 – FR-13a, FR-17 – FR-19, FR-24 | `auth.ts`, `auth.config.ts` | Exists |
| FR-13b, FR-14, FR-15, FR-20 | `auth.ts`, `auth.config.ts`, `proxy.ts`, removal of `app/(auth)/signup`, `lib/actions/auth.ts` sign-up | Planned — Phase 1 |
| FR-16 – FR-16e | `lib/bootstrap.ts`, `lib/auth/*`, `lib/actions/{email-verification,password-reset}.ts` | Exists |
| FR-30, FR-31, FR-103 | `lib/permissions.ts`, `lib/permissions.test.ts` | Planned — Phase 1 |
| FR-37 – FR-39a | `lib/actions/users.ts`, `lib/auth/require-session.ts`, `proxy.ts` | Exists |
| FR-40 – FR-49 | `lib/actions/users.ts`, `lib/queries/users.ts` | Exists; FR-40e and profile linking planned — Phase 1 |
| FR-50 – FR-62 | `lib/actions/{profile,security,connections,tokens,twoFactor}.ts` | Exists |
| FR-70 – FR-87 | `lib/actions/preferences.ts`, `lib/audit.ts`, `lib/queries/audit.ts` | Exists |
| FR-90 – FR-95 | `lib/actions/{feedback,settings,announcements,email-settings}.ts`, `components/admin/*` | Exists; move to `/settings` planned — Phase 1 |
| FR-100, FR-104, FR-106 | `app/layout.tsx`, `app/globals.css`, `components/layout/AppShell.tsx`, `components/layout/AppSidebar.tsx`, `components/layout/AppHeader.tsx` | Planned — Phase 1 |
| FR-101 – FR-102, FR-105 | `prisma/schema.prisma`, `lib/auth/require-session.ts` | Planned — Phase 1 |
| FR-200 – FR-215 | `lib/actions/eval/{departments,teachers,committee}.ts`, `lib/queries/eval/*`, `app/teachers`, `app/committee`, `app/settings/departments`, `components/teachers`, `components/committee` | Planned — Phase 2 |
| FR-300 – FR-302 | `lib/actions/eval/rounds.ts`, `lib/eval/round-lifecycle.ts`, `app/rounds` | Planned — Phase 2 |
| FR-310 – FR-322 | `lib/actions/eval/rubric.ts`, `lib/eval/rubric-template.ts`, `lib/scoring/bands.ts`, `app/rounds/[id]/{rubric,bands}` | Planned — Phase 3 |
| FR-400 – FR-405 | `lib/actions/eval/assignments.ts`, `app/assignments` | Planned — Phase 3 |
| FR-500 – FR-511 | `lib/scoring/*`, `lib/actions/eval/evaluations.ts`, `app/evaluate`, `components/evaluate` | Planned — Phase 4 |
| FR-512 – FR-524 | `lib/actions/eval/review.ts`, `lib/scoring/aggregate.ts`, `lib/eval/status.ts` | Planned — Phase 5 |
| FR-600 – FR-611 | `app/dashboard`, `app/monitoring`, `lib/queries/eval/monitoring.ts`, `components/charts` | Planned — Phase 5 |
| FR-700 – FR-713 | `app/results`, `app/reports`, `app/reports/export`, `lib/reports/*` | Planned — Phase 6 |
| FR-800 – FR-811 | `lib/actions/search.ts`, `components/search`, `lib/notifications.ts`, `app/notifications` | Planned — Phase 7 |
| FR-803, FR-890 | `app/settings`, `lib/action-codes.ts` | Planned — Phases 1–7 |
| FR-900 – FR-901 | `scripts/seed-demo.mts` | Planned — Phase 1 onward |

### Appendix C — Open policy questions and known deviations

**Policy defaults awaiting HR confirmation (ROADMAP Phase 0).** The system ships these as editable
defaults; none is official until HR confirms it.

| # | Topic | Default in the system |
|---|---|---|
| P-1 | Official rubric (categories, criteria, min/max, weights) | PLAN §11's five categories, 100 points, weight 1 |
| P-2 | Result bands | 90 ดีเยี่ยม / 80 ดีมาก / 70 ดี / 60 พอใช้ / <60 ต้องปรับปรุง |
| P-3 | Combining committee scores | Arithmetic average of approved evaluations' percentages |
| P-4 | Required comments | None required by default; configurable per criterion |
| P-5 | Who approves/finalizes and may reopen | Any `ADMIN` |
| P-6 | What teachers see | Own finalized results, totals, category breakdown, comments by committee role (not name), no per-member scores |
| P-7 | Committee visibility of other members' evaluations | None |
| P-8 | Appeals / corrections after finalization | Un-finalize by `ADMIN` with a reason; no teacher-initiated appeal |
| P-9 | Report wording and signature layout | PLAN §17 |
| P-10 | Academic-year convention | พ.ศ.; round dates set by HR per round |

**Known deviations**

| # | Requirement | Deviation |
|---|---|---|
| D-12 | NFR-25 | Vitest exists with three suites (`lib/permissions.test.ts`, `lib/auth/{rate-limit,totp}.test.ts`); no CI, and no integration tests against a database. |
| D-14 | §2.4 | `package-lock.json` coexists with the authoritative `pnpm-lock.yaml`. |
| D-15 | DR-05 | No `AuditLog` retention enforcement (no scheduled-job infrastructure). |
| D-16 | FR-31a | ⌘K palette's static nav list is not role-filtered (fixed by FR-800, Phase 7). |
| D-17 | NFR-01 | `AUTH_SECRET` has no rotation story (2FA secrets and SMTP password depend on it). |
| D-18 | FR-93 | `appDomain` in `lib/app-config.ts` has no consumers. |
| D-19 | §1.2 | The Supabase database is shared with an unrelated application whose tables live in `public`; isolation relies on the `portal` schema and on never querying `public`. |
| D-20 | §2.3 | Until Phase 1 lands, the code still has the four-role model and public `/signup`. |
