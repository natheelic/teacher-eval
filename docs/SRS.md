# Software Requirements Specification

**Product:** Portal — user management application
**Repository:** `natheelic/portal`
**Document version:** 1.0
**Status:** Baselined against the code as of commit `87bc4a4`
**Format:** IEEE Std 830-1998

> Every requirement in this document describes behaviour that exists in the codebase today,
> unless it is explicitly marked **[NOT IMPLEMENTED]**. Deviations are collected in
> [Appendix C](#appendix-c--known-deviations) and scheduled in [`ROADMAP.md`](./ROADMAP.md).

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Overall description](#2-overall-description)
3. [Specific requirements](#3-specific-requirements)
4. [Appendices](#4-appendices)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements of **Portal**, a
self-hosted web application for managing user accounts, roles, and access.

It is written for developers extending the system, reviewers assessing changes, and automated
coding agents (see [`../CLAUDE.md`](../CLAUDE.md)). It is the authority on *what the system must
do*; `CLAUDE.md` is the authority on *how the codebase is arranged*.

### 1.2 Scope

**Portal** provides a single administrative surface for a population of user accounts, plus a
self-service account area for every authenticated user.

**In scope**

- Authentication: email + password credentials, optional Google OAuth.
- Role-based authorization with four ranks and explicit privilege-escalation guards.
- User administration: create, change role, suspend, reactivate, reset password, soft delete.
- Session management: per-device sessions that can be listed and revoked.
- Personal API tokens: issuance, preview, revocation.
- An append-only audit log with scope-based visibility.
- Per-user preferences: theme, sidebar behaviour, telemetry flag, keyboard shortcuts.

**Explicitly out of scope**

- Multi-tenancy. Organizations, projects, memberships, custom domains and service versions
  existed in the ancestor template and were **deliberately removed** in migration
  `20260826090000_users_only`. They must not be reintroduced.
- Billing, plans, quotas, or metering.
- Outbound email of any kind. There is no mail transport, therefore no email verification,
  no password-reset link, and no invitation email.
- Any consumer of the personal API tokens. Tokens can be minted; nothing authenticates with them.
- Federated identity beyond Google (no SAML, no LDAP, no WebAuthn).

### 1.3 Definitions, acronyms and abbreviations

| Term | Definition |
|---|---|
| **Actor** | The authenticated user performing an operation. |
| **Target** | The user an administrative operation is performed *upon*. |
| **Rank** | The integer ordering of roles: `ADMIN` 3 > `MANAGER` 2 > `MEMBER` 1 > `VIEWER` 0. |
| **Device session** | A row in `DeviceSession`, representing one signed-in browser or device. Distinct from the Auth.js `Session` table. |
| **`sid`** | The device-session identifier carried inside the JWT; the join key between a token and its `DeviceSession` row. |
| **`uid`** | The user identifier carried inside the JWT. |
| **Bootstrap admin** | The first account ever created, which is promoted to `ADMIN` so a fresh database is usable. |
| **Soft delete** | Marking `User.deletedAt`, suspending the account and rewriting its email, rather than removing the row. |
| **Admin surface** | The users table at `/users`, as opposed to the self-service area under `/account`. |
| **Server Action** | A Next.js `"use server"` function invoked directly from a component; this system's mutation mechanism. |
| **Audit action code** | A stable machine-readable key such as `user.role.changed`, stored in `AuditLog.actionCode`. |

### 1.4 References

| Ref | Document |
|---|---|
| R1 | IEEE Std 830-1998, *Recommended Practice for Software Requirements Specifications* |
| R2 | Auth.js v5 (NextAuth) documentation — `next-auth@5.0.0-beta.32` |
| R3 | Prisma 7 documentation — driver adapters and `prisma.config.ts` |
| R4 | Next.js 16 documentation, vendored at `node_modules/next/dist/docs/` |
| R5 | [`../CLAUDE.md`](../CLAUDE.md) — codebase architecture guide |
| R6 | [`./ROADMAP.md`](./ROADMAP.md) — delivery plan for unimplemented requirements |

### 1.5 Overview

Section 2 describes the product context, its user classes, and the constraints that bind any
implementation. Section 3 states the requirements themselves, numbered `FR-nn` (functional) and
`NFR-nn` (non-functional), each traced to the file that implements it. Section 4 holds the
environment contract, a traceability matrix, and the list of known deviations.

---

## 2. Overall description

### 2.1 Product perspective

Portal is a self-contained web application. It is not a component of a larger system and exposes
no public API.

It descends from a static Supabase-style hosting-console template. The initial migration
(`20260825225617_init`) still shows that ancestry — `Organization`, `Project`, `ProjectMember`,
`CustomDomain`, and a `Role` enum of `OWNER`/`ADMIN`/`DEVELOPER`/`READ_ONLY`. The second
migration removed all of it and reshaped `Role` and `AuditLog` around users. Residual copy from
that era still exists in a few places and is tracked in Appendix C.

```
                 ┌──────────────────────────────┐
   Browser ─────▶│  proxy.ts   (redirect only)  │  sees the decoded JWT, never the DB
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  Server Components / Actions │
                 │  requireUser()  ← the real   │  authorization + revocation enforced here
                 │  authorization boundary      │
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  Prisma 7 + @prisma/adapter-pg│
                 └──────────────┬───────────────┘
                                ▼
                        PostgreSQL (Docker)
```

### 2.2 Product functions

| # | Function | Available to |
|---|---|---|
| F1 | Sign up, sign in, sign out | Anonymous / all |
| F2 | Browse, search and filter the user population | `ADMIN`, `MANAGER` |
| F3 | Create users and assign roles | `ADMIN`, `MANAGER` |
| F4 | Change a user's role | `ADMIN`, `MANAGER` |
| F5 | Suspend / reactivate a user | `ADMIN`, `MANAGER` |
| F6 | Reset another user's password | `ADMIN`, `MANAGER` |
| F7 | Delete a user | `ADMIN` |
| F8 | Manage own profile, password, sign-in methods | All |
| F9 | List and revoke own device sessions | All |
| F10 | Mint and revoke own API tokens | All |
| F11 | Read the audit log | All (own actions); `ADMIN`/`MANAGER` (all actions) |
| F12 | Set own preferences | All |
| F13 | Request / cancel deletion of own account | All |

### 2.3 User classes and characteristics

Four roles, defined as `enum Role` in `prisma/schema.prisma` and ordered by the private `RANK`
map in `lib/permissions.ts`.

| Role | Rank | Landing page | Capabilities |
|---|---|---|---|
| `ADMIN` | 3 | `/users` | Everything. The only role that may delete users or assign `ADMIN`. |
| `MANAGER` | 2 | `/users` | May act on `MEMBER` and `VIEWER` only; may assign only `MEMBER`/`VIEWER`; may suspend but never delete. |
| `MEMBER` | 1 | `/account/preferences` | Self-service only. |
| `VIEWER` | 0 | `/account/preferences` | Self-service only. Functionally identical to `MEMBER` today. |

A user also carries a `UserStatus`: `ACTIVE`, `INVITED`, or `SUSPENDED`. Only `ACTIVE` and
`SUSPENDED` are reachable in the current implementation.

### 2.4 Operating environment

| Component | Requirement |
|---|---|
| Runtime | Node.js (the Auth.js route handler pins `runtime = "nodejs"`) |
| Database | PostgreSQL, provisioned locally by `docker-compose.yml` alongside pgAdmin |
| Package manager | pnpm 11.17.0 (`packageManager` field). `package-lock.json` is present but **not** authoritative. |
| Browser | Any modern browser with JavaScript enabled and `localStorage` available |

### 2.5 Design and implementation constraints

These are load-bearing. Violating any of them breaks the system in ways that are not obvious at
the point of the change.

- **C-1 — `auth.config.ts` must remain edge-safe.** It must not import Prisma or bcrypt. It is
  consumed by `proxy.ts`, which runs before the request reaches application code.
- **C-2 — The Credentials provider forces `session.strategy: "jwt"`.** Consequently the Auth.js
  adapter `Session` table is permanently empty and must never be read. The user-visible session
  list is the separate `DeviceSession` model, keyed by the JWT's `sid`.
- **C-3 — `proxy.ts` is a redirect layer only.** It sees only the decoded JWT and therefore
  cannot observe suspension, revocation, or deletion. It must never be treated as an
  authorization boundary.
- **C-4 — `requireUser()` in `lib/auth/require-session.ts` is the single authorization
  boundary.** Every protected page and every Server Action must call it. It is the only place
  where revocation, suspension and deletion are enforced.
- **C-5 — `lib/env.ts` must never be imported from a Client Component.** It parses server
  secrets at import time and throws; in the browser those variables do not exist, so the parse
  would fail during hydration. Client-safe configuration lives in `lib/app-config.ts`.
- **C-6 — Product-agnostic copy reads `appName` / `appDomain` from `lib/app-config.ts`.**
  No product name may be hardcoded in a component.
- **C-7 — Mutations are Server Actions, not route handlers.** Route handlers are reserved for
  `[...nextauth]`, machine APIs, and webhooks.
- **C-8 — The datasource URL lives in `prisma.config.ts`, not `schema.prisma`** (Prisma 7). The
  generator is `prisma-client`, emitting TypeScript to `lib/generated/prisma`; the client must be
  imported from `@/lib/prisma`.
- **C-9 — Next 16 renamed `middleware.ts` to `proxy.ts`.** It exports `proxy` plus
  `config.matcher`, defaults to the Node runtime, and setting `runtime` there throws.

### 2.6 Assumptions and dependencies

- **A-1** A database is reachable at `DATABASE_URL` before the application boots; `lib/env.ts`
  throws at import time otherwise.
- **A-2** Google OAuth is optional. Providers are registered only when both `AUTH_GOOGLE_ID` and
  `AUTH_GOOGLE_SECRET` are set; `googleEnabled` gates the UI accordingly.
- **A-3** The deployment is trusted internally. There is no rate limiting, CAPTCHA, or brute-force
  lockout.
- **A-4** Clock skew between application and database is negligible; session expiry compares
  against database time.
- **A-5** `/signup` is open to anyone who can reach it. Restricting registration is a deployment
  concern, not an application feature.

---

## 3. Specific requirements

### 3.1 External interface requirements

#### 3.1.1 User interfaces

| Route | File | Access | Content |
|---|---|---|---|
| `/` | `app/page.tsx` | Anonymous and authenticated | Public landing page: product summary and links to `/signin` and `/signup`. Reads no session. |
| `/dashboard` | `app/dashboard/page.tsx` | All | Signed-in home. `ADMIN`/`MANAGER` get user stats and everyone's recent activity; `MEMBER`/`VIEWER` get their own activity only. Anonymous ⇒ `/signin`. |
| `/users` | `app/users/page.tsx` | `ADMIN`, `MANAGER` | Users table. Anonymous ⇒ `/signin`; `MEMBER`/`VIEWER` ⇒ `/account/preferences`. |
| `/signin` | `app/(auth)/signin/page.tsx` | Anonymous | Credentials form, optional Google button, mapped error copy. |
| `/signup` | `app/(auth)/signup/page.tsx` | Anonymous | Registration form, optional Google button. |
| `/account/set-password` | `app/(auth)/account/set-password/page.tsx` | All (no `passwordHash`) | Mandatory password-setup step, reached only via the FR-39a redirect. |
| `/account/preferences` | `app/account/preferences/page.tsx` | All | Profile, sign-in methods, connections, appearance, shortcuts, dashboard, analytics, danger zone. |
| `/account/security` | `app/account/security/page.tsx` | All | Password, two-factor toggle, active device sessions. |
| `/account/access-tokens` | `app/account/access-tokens/page.tsx` | All | Personal API token list and creation form. |
| `/account/audit-logs` | `app/account/audit-logs/page.tsx` | All | Audit log table with range and scope filters. |

The `(auth)` route group exists solely to give the auth pages a bare layout without altering
their URLs. There is no `app/account/layout.tsx`; each account page composes its own
`AccountHeader` + `SettingsSidebar`.

- **FR-01** — Each account page shall pass a literal from the union
  `"Preferences" | "Access Tokens" | "Security" | "Audit Logs"` as `SettingsSidebar`'s `active`
  prop, so the current nav item is highlighted.
  *Implementation:* `components/account/SettingsSidebar.tsx`
- **FR-02** — The application shall apply the user's theme before first paint, using a
  paint-blocking inline script in `app/layout.tsx` that reads `localStorage` and sets
  `data-theme` on the document element.
- **FR-03** — Timestamps shall be rendered as absolute strings from the server, and upgraded to
  relative form ("2 minutes ago") only after hydration, to avoid server/client mismatch.
  *Implementation:* `components/account/RelativeTime.tsx`, via `useSyncExternalStore`

#### 3.1.2 Software interfaces

| Interface | Detail |
|---|---|
| Auth.js HTTP | `app/api/auth/[...nextauth]/route.ts`, `runtime = "nodejs"` |
| Google OAuth | Redirect URI `<origin>/api/auth/callback/google`; `allowDangerousEmailAccountLinking: false` |
| Database | Prisma 7 client over the `@prisma/adapter-pg` driver adapter |
| Password hashing | `bcryptjs` |
| Token hashing | Node `crypto`, SHA-256 |
| User-agent parsing | `ua-parser-js`, for device-session labelling |

#### 3.1.3 Communications interfaces

- **FR-04** — All state changes shall be performed by Server Actions that end with
  `revalidatePath` for the affected route. The system exposes no REST or GraphQL mutation surface.
- **FR-05** — List filters (users, audit logs) shall be expressed as URL `searchParams` and
  resolved on the server, not fetched by client code.

---

### 3.2 Functional requirements

#### FR-1x — Authentication

*Implemented in `auth.ts`, `auth.config.ts`, `proxy.ts`, `lib/actions/auth.ts`, `lib/bootstrap.ts`.*

- **FR-10** — The system shall authenticate a user given an email and password. Email lookup
  shall be case-insensitive (the address is lowercased before lookup).
- **FR-11** — Password verification shall execute even when the account has no `passwordHash`,
  so that response time does not disclose whether an account exists.
- **FR-12** — Authentication shall be refused for any user whose `deletedAt` is set.
- **FR-13** — The system shall offer Google as a sign-in provider **if and only if** both
  `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are configured. Automatic linking of a Google
  identity to an existing email shall be disabled.
- **FR-13a** — A Google sign-up shall populate `firstName`/`lastName` from the profile's
  `given_name`/`family_name`, not leave them unset. *Implementation:* the Google provider's
  `profile()` override in `auth.config.ts`.
- **FR-14** — Registration shall accept first name (required), last name (optional), email and a
  password meeting `passwordSchema`, and shall reject an email already in use.
- **FR-15** — **The first account ever created shall be assigned `role: ADMIN`;** every
  subsequent account shall be assigned `role: MEMBER`. Both are created with `status: ACTIVE`, an
  empty `UserPreferences` row, and a generated unique username, inside a single transaction.
  *Implementation:* `bootstrapUser()` in `lib/bootstrap.ts`
  *Rationale:* without this, a fresh database has no one able to reach the users table.
- **FR-16** — Usernames shall be derived from the email local part, slugified, and disambiguated
  with suffixes `-1` … `-49`, falling back to a random 8-character suffix.
  *Implementation:* `uniqueUsername()` in `lib/bootstrap.ts`
- **FR-17** — On initial sign-in the system shall create a `DeviceSession` row and stamp its id
  into the JWT as `sid`, alongside the user id as `uid`. Device labelling shall degrade
  gracefully when request headers are unavailable.
  *Implementation:* `createDeviceSession()`, `lib/auth/device.ts`
- **FR-18** — Sessions shall expire after 30 days (`SESSION_MAX_AGE_SECONDS`).
- **FR-19** — Signing out shall revoke the current `DeviceSession`. Failure to revoke shall not
  prevent sign-out.
- **FR-20** — An unauthenticated request to a non-public path shall redirect to
  `/signin?callbackUrl=<pathname+search>`. Public prefixes are `/signin`, `/signup`, `/api/auth`;
  `/` is public as an exact match only.
- **FR-21** — An authenticated request to `/signin` or `/signup` shall redirect to
  `DEFAULT_SIGNED_IN_PATH` (`/dashboard`), which is also the fallback when no `callbackUrl` is
  given.
- **FR-22** — `callbackUrl` shall be sanitised before use, so that a crafted value cannot redirect
  the user off-site after sign-in.
- **FR-23** — Failed credential authentication shall report exactly `"Incorrect email or
  password."` — never distinguishing an unknown email from a wrong password.
- **FR-24** — On `trigger === "update"` the JWT callback shall refresh the token's name, email
  and picture from the session update.

#### FR-2x — Authorization

*Implemented in `lib/permissions.ts` (pure) and enforced in `lib/auth/require-session.ts` and
`lib/actions/users.ts`.*

- **FR-30** — `lib/permissions.ts` shall be the single source of truth for who may act on whom.
  It shall contain no Prisma access and no request context, so that every rule is a pure,
  independently testable function.
- **FR-31** — Only `ADMIN` and `MANAGER` shall reach the admin surface.
  *`canManageUsers(role)`*
- **FR-32** — **No user may act on themselves through the admin surface.** Self-service belongs
  under `/account`. `canActOnUser` returns `false` whenever `actor.id === target.id`.
- **FR-33** — An `ADMIN` may act on any other user.
- **FR-34** — A `MANAGER` may act on a target only when the target's rank is **strictly lower**
  than `MANAGER` — that is, on `MEMBER` and `VIEWER` only, never on another `MANAGER`, never on
  an `ADMIN`.
- **FR-35** — A `MANAGER` may assign only roles ranked below `MANAGER`. An `ADMIN` may assign any
  role. Any other role may assign none.
  *`assignableRolesFor(actorRole)`, `canAssignRole()`*
  *Rationale:* FR-34 and FR-35 together close the privilege-escalation path. Either alone is
  insufficient.
- **FR-36** — Deleting a user shall be permitted to `ADMIN` only. A `MANAGER` denied a delete
  shall be offered suspension instead.
  *`canDeleteUsers(role)`; enforced in `deleteUser` with "Only admins can delete users"*
- **FR-37** — The system shall refuse to demote, suspend or delete the **final active admin**.
  *Implementation:* private `assertNotLastAdmin` in `lib/actions/users.ts`
  *Rationale:* otherwise the users table becomes permanently unreachable and the installation is
  unrecoverable without direct database access.
- **FR-38** — Every administrative action shall resolve its actor and target through a single
  gate that runs `requireUserManager()` and `canActOnUser()`, failing with "Insufficient
  permissions to modify this user".
  *Implementation:* private `loadActionable(targetId)` in `lib/actions/users.ts`
- **FR-39** — `requireUser()` shall reject a caller whose account is `SUSPENDED`, soft-deleted, or
  whose `DeviceSession` has been revoked or has expired. Because the JWT is self-contained,
  this is the **only** point at which revocation takes effect — and it therefore takes effect on
  the very next request.
- **FR-39a** — `requireUser()` shall redirect any authenticated caller with no `passwordHash` to
  `/account/set-password`, since a password is currently the only account-recovery path. This
  applies retroactively to any account that already has no password, not only new sign-ups.
  `/account/set-password` and its `changePassword` Server Action are exempted from this
  redirect via the `x-pathname` header the proxy forwards, to avoid redirecting to itself.
  *Implementation:* `lib/auth/require-session.ts`, `proxy.ts`.

#### FR-3x — User administration

*Implemented in `lib/actions/users.ts` and `lib/queries/users.ts`.*

- **FR-40** — An authorised actor shall be able to create a user with an email, password, name
  and role, subject to FR-35. The system shall reject a duplicate email, hash the password,
  generate a unique username, record `invitedById` as the actor, and create an empty
  `UserPreferences` row. Audit: `user.created` (201).
- **FR-41** — An authorised actor shall be able to change a target's role, subject to FR-34,
  FR-35 and FR-37. Audit: `user.role.changed`.
- **FR-42** — An authorised actor shall be able to suspend or reactivate a target, subject to
  FR-34 and FR-37. Suspension shall, **in one transaction**, set `status: SUSPENDED` and revoke
  every `DeviceSession` belonging to the target. Audit: `user.suspended` / `user.reactivated`.
- **FR-43** — An authorised actor shall be able to reset a target's password. This shall rehash
  the password and revoke all of the target's device sessions. Audit: `user.password.reset`.
- **FR-44** — Deletion shall be a **soft delete**: set `deletedAt`, set `status: SUSPENDED`,
  rewrite the email to `deleted+<id>@invalid.local`, null the username, revoke all device
  sessions, and delete every linked OAuth `Account` row. The `User` row shall be retained.
  Audit: `user.deleted`. *Implementation:* `softDeleteUser()` in `lib/auth/deletion.ts`.
  *Rationale:* audit history references users; hard deletion would orphan it. Rewriting the
  email frees the address for reuse without violating the unique constraint — the `Account`
  deletion does the same for the OAuth identity, since a provider like Google resolves a
  returning sign-in by `providerAccountId`, not email. Without it, a soft-deleted user's Google
  identity would stay bound to the dead row forever, and a later Google sign-in would silently
  resolve back to it rather than creating a fresh account.
- **FR-44a** — Sign-in via an OAuth provider shall be refused for any account whose `deletedAt`
  is set or whose `status` is `SUSPENDED`, mirroring FR-12's guarantee for the Credentials
  provider — the OAuth path has no equivalent check in Auth.js core.
  *Implementation:* the `signIn()` callback in `auth.ts`.
- **FR-45** — The users list shall exclude soft-deleted users (`deletedAt: null`).
- **FR-46** — The users list shall support a free-text query (≤ 100 characters), a role filter, a
  status filter, and cursor-based pagination at 25 rows per page.
  *`parseUserFilters()`, `getUsers()`*
- **FR-47** — The users list shall report a `total` reflecting the active filters, and a `stats`
  block (`total`, `active`, `suspended`, `admins`) computed **without** the filters.
- **FR-48** — No query shall ever select `passwordHash`. Whether a user has a password shall be
  exposed only as the derived boolean `hasPassword`.
- **FR-49** — `getUsers()` shall itself call `requireUserManager()`, so the read is protected
  independently of the page that calls it.

#### FR-4x — Self-service account

*Implemented in `lib/actions/{profile,security,connections,tokens}.ts` and `lib/queries/account.ts`.*

**Profile**

- **FR-50** — A user shall be able to update first name, last name and username. The username
  shall match `/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/`, be 3–40 characters, and be unique. `name`
  shall be stored as the joined first and last name. Audit: `account.profile.updated`.

**Sign-in methods and connections**

- **FR-51** — A user shall be able to link a supported OAuth provider (currently `google` only).
- **FR-52** — **The system shall never allow a user to unlink their last remaining sign-in
  method.** `unlinkProvider` shall refuse when fewer than one method would remain, and
  `canUnlink` shall be false in the UI for the same condition. Audit:
  `account.connection.removed`.
  *Rationale:* the account would become permanently inaccessible.
- **FR-53** — A user who signed in via OAuth and has no `passwordHash` shall be able to *set* a
  password without supplying a current one. A user who has a password must supply the correct
  current password.

**Password**

- **FR-54** — Changing a password shall, in a single transaction, update `passwordHash`, set
  `passwordUpdatedAt`, and revoke **every other** device session — the caller's own session,
  identified by `sid`, shall be preserved. Audit: `account.password.changed`.

**Device sessions**

- **FR-55** — A user shall see their active device sessions, with revoked and expired rows
  filtered out and the current session marked via `sid`.
- **FR-56** — A user shall be able to revoke one session or all other sessions. Revocation shall
  be scoped by `userId` so a crafted id cannot revoke another user's session. Audit:
  `account.session.revoked` / `account.session.revoked_all`.

**API tokens**

- **FR-57** — A user shall be able to mint a personal API token with a name of 1–80 characters.
  The system shall store only the SHA-256 hash plus a `prefix` and `last4`, and shall return the
  plaintext token **exactly once**, at creation. Audit: `account.token.created` (201).
- **FR-58** — Tokens shall be displayed as `prefix_••••••••last4`; the plaintext shall never be
  retrievable again.
- **FR-59** — A user shall be able to revoke a token, scoped by `userId`. Audit:
  `account.token.revoked`.

**Account deletion**

- **FR-60** — A user shall be able to request deletion of their own account, confirmed by their
  current password when one is set. This sets `deletionRequestedAt` and revokes every
  `DeviceSession` for that user, including the one making the request, signing them out
  immediately. Audit: `account.deletion.requested` (202).
- **FR-61** — A user shall be able to cancel a pending deletion request, explicitly via
  `/account/preferences` or implicitly by successfully signing back in — either Credentials or
  OAuth. Signing in is the same trust bar as clicking Cancel, so it is treated the same way; the
  sign-in path only writes the audit row when a request was actually pending. Audit:
  `account.deletion.cancelled`. *Implementation:* `cancelPendingDeletion()` in
  `lib/auth/deletion.ts`, called from `cancelAccountDeletion()` and from the `jwt()` callback in
  `auth.ts`.
- **FR-61a** — Thirty days after `deletionRequestedAt`, the account shall be soft-deleted per
  FR-44. There is no scheduled job; `requireUser()` checks the window on every authenticated
  request and performs the soft delete lazily, the same chokepoint that already enforces
  revocation and suspension. Audit: `user.deleted`.

**Two-factor**

- **FR-62** — **[NOT IMPLEMENTED]** Two-factor authentication. `setTwoFactorEnabled` flips the
  `User.twoFactorEnabled` boolean and writes an audit entry, but `twoFactorSecret` is never
  written or read and the sign-in flow contains no second-factor step. The toggle is currently
  cosmetic. See [`ROADMAP.md`](./ROADMAP.md) Phase 1.

#### FR-5x — Preferences

*Implemented in `lib/actions/preferences.ts`; every action calls `requireUser()` and upserts
`UserPreferences`.*

- **FR-70** — A user shall be able to set their theme to `LIGHT`, `DARK` or `SYSTEM`.
  `UserPreferences.theme` is authoritative; `localStorage` is a paint-blocking cache.
  `useSyncedTheme` shall write `localStorage` first, then the database.
- **FR-71** — A user shall be able to set `sidebarBehavior` to `OPEN`, `CLOSED` or
  `EXPAND_ON_HOVER`. **[PARTIALLY IMPLEMENTED]** — the value is stored but no component reads it.
- **FR-72** — A user shall be able to toggle `telemetryEnabled`. **[PARTIALLY IMPLEMENTED]** —
  stored, but nothing consults it.
- **FR-73** — A user shall be able to toggle the dashboard flags `editEntitiesInCode` and
  `queueTableOperations`. The action shall accept only those two keys (allow-list).
  **[PARTIALLY IMPLEMENTED]** — stored, but nothing consults them.
- **FR-74** — A user shall be able to enable or disable individual keyboard shortcuts. The slug
  shall match `/^[a-z0-9-]{1,64}$/` and be merged into the `keyboardShortcuts` JSON map.
  **[PARTIALLY IMPLEMENTED]** — only ⌘K (the command palette) is actually wired to a behaviour.
- **FR-75** — Preferences reads shall fall back to the schema defaults when no row exists.

#### FR-6x — Audit

*Implemented in `lib/audit.ts` and `lib/queries/audit.ts`.*

- **FR-80** — Every security-relevant operation shall write one `AuditLog` row carrying an actor,
  a human-readable `action` sentence, a machine-readable `actionCode`, an optional target, and
  best-effort client IP and user-agent.
- **FR-81** — **Auditing shall never be the reason a user-visible operation fails.** `logAudit`
  shall wrap its entire body in a try/catch that logs to the console and returns.
- **FR-82** — Audit rows shall denormalise `targetLabel`, and both user foreign keys shall be
  `SetNull` on delete, so history survives the removal of either party.
- **FR-83** — The audit view shall support a range filter of `24h`, `7d`, `30d` or `all`,
  defaulting to `24h`, and cursor pagination at 25 rows.
- **FR-84** — The audit view shall support a scope of `mine` or `all`. A viewer who cannot manage
  users shall be constrained to their own rows **even when they request `scope=all`**:
  `if (!canSeeAll || filters.scope === "mine") where.actorId = viewer.id;`
- **FR-85** — The system shall record the following action codes:

  | Code | Meaning |
  |---|---|
  | `account.created` | Registration (annotated as the first/admin account when applicable) |
  | `account.profile.updated` | Name or username changed |
  | `account.password.changed` | Own password changed |
  | `account.2fa.enabled` / `account.2fa.disabled` | Two-factor flag flipped |
  | `account.session.revoked` | One device session revoked |
  | `account.session.revoked_all` | All other device sessions revoked |
  | `account.connection.removed` | OAuth provider unlinked |
  | `account.token.created` / `account.token.revoked` | API token lifecycle |
  | `account.deletion.requested` / `account.deletion.cancelled` | Self-deletion request lifecycle |
  | `user.created` | Account created via the admin surface |
  | `user.role.changed` | Target's role changed |
  | `user.suspended` / `user.reactivated` | Target's status changed |
  | `user.password.reset` | Target's password reset by an administrator |
  | `user.deleted` | Target soft-deleted |

- **FR-86** — **[NOT IMPLEMENTED]** Filtering by `actionCode`, target, method, status code, IP or
  user agent. These columns are written but neither surfaced nor filterable. There is also no
  central constant for the codes in FR-85 — they are inline string literals at each call site.

---

### 3.3 Non-functional requirements

#### Security

- **NFR-01** — Passwords shall be stored only as bcrypt hashes (`bcryptjs`). Plaintext shall
  never be persisted or logged.
- **NFR-02** — Password verification shall run even when no hash exists, to avoid a timing oracle
  for account existence (see FR-11).
- **NFR-03** — API tokens shall be stored only as SHA-256 hashes with a unique constraint. The
  plaintext shall exist in exactly one response and never be recoverable.
- **NFR-04** — Every destructive or privileged operation shall re-verify authorization
  server-side. UI affordances are never the control.
- **NFR-05** — All operations on a subordinate object (device session, API token) shall be scoped
  by `userId` in the query itself, not filtered after the fetch.
- **NFR-06** — Revocation shall take effect on the next request (FR-39). No cached decision may
  outlive it.
- **NFR-07** — Redirect targets derived from user input shall be sanitised (FR-22).
- **NFR-08** — Error messages on authentication failure shall not disclose account existence
  (FR-23).

#### Reliability

- **NFR-10** — Audit logging shall be strictly best-effort and shall never propagate an exception
  (FR-81).
- **NFR-11** — Multi-step state changes with a safety invariant — suspension + revocation,
  password change + revocation, soft delete + revocation — shall execute inside a database
  transaction.
- **NFR-12** — Device-session creation shall tolerate the absence of request headers rather than
  failing sign-in.

#### Maintainability

- **NFR-20** — The system shall follow one composition pattern throughout: **a server shell owns
  layout and copy; a small client leaf owns the interactivity.** This keeps
  `SettingsCard`/`SettingsRow` composition intact.
- **NFR-21** — New settings sections shall be composed from `SettingsPrimitives`
  (`SectionHeading` + `SettingsCard` + `SettingsRow`) rather than rebuilding card markup.
- **NFR-22** — Components shall be organised by route family (`dashboard/`, `users/`, `account/`,
  `auth/`, `layout/`, `search/`, `theme/`), not by type.
- **NFR-23** — Read paths shall live in `lib/queries/*` and be wrapped in `React.cache`;
  mutations shall live in `lib/actions/*` under `"use server"`.
- **NFR-24** — The codebase shall pass `pnpm lint` and `pnpm typecheck`.
- **NFR-25** — **[NOT IMPLEMENTED]** Automated tests. No test framework is configured.

#### Portability and configuration

- **NFR-30** — A malformed or incomplete server environment shall fail loudly at boot. `lib/env.ts`
  parses with zod at import time and throws (see Appendix A).
- **NFR-31** — Client-safe configuration shall be limited to `NEXT_PUBLIC_*` variables accessed
  as static `process.env.X` members, so Next inlines them at build time.
- **NFR-32** — `NEXT_PUBLIC_APP_DOMAIN` shall be validated as a **bare hostname**; values
  containing `://` or `/` shall be rejected.

#### Usability

- **NFR-40** — The interface shall support light and dark themes, applied before first paint
  (FR-02).
- **NFR-41** — The interface shall be usable on small viewports via `MobileNavProvider` and
  `MobileDrawer`.
- **NFR-42** — A command palette shall be reachable with ⌘K.
  **[PARTIALLY IMPLEMENTED]** — it searches a hardcoded 5-item navigation list, not live data.

---

### 3.4 Data requirements

Defined in `prisma/schema.prisma`. PostgreSQL; ids are cuids unless noted.

| Model | Purpose | Notes |
|---|---|---|
| `User` | The central entity | Identity, `role`, `status`, `passwordHash`, `twoFactorEnabled`/`twoFactorSecret`, `deletionRequestedAt`, `deletedAt`, `lastLoginAt`, self-relation `invitedBy`/`invitees` (`SetNull`). Indexed on `role`, `status`, `createdAt desc`, `deletionRequestedAt`. |
| `Account` | Auth.js adapter contract | OAuth tokens; `@@id([provider, providerAccountId])`; cascade-deleted with the user. |
| `Session` | Auth.js adapter contract | **Intentionally always empty** — see C-2. Must not be read. |
| `VerificationToken` | Auth.js adapter contract | **Unused.** Reserved for email verification / password reset. |
| `Authenticator` | WebAuthn credential shape | **Unused.** No WebAuthn flow exists. |
| `UserPreferences` | Per-user settings | `userId` is the primary key. `theme`, `sidebarBehavior`, `telemetryEnabled`, `editEntitiesInCode`, `queueTableOperations`, `keyboardShortcuts` (JSON). Cascade-deleted. |
| `DeviceSession` | One signed-in device | `id` equals the JWT `sid`. Carries device label/type, UA, IP, location, `lastActiveAt`, `expiresAt`, `revokedAt`. Indexed on `[userId, revokedAt]` and `[expiresAt]`. |
| `ApiToken` | Personal access token | `tokenHash` unique; `prefix`, `last4`, `scopes[]`, `lastUsedAt`, `expiresAt`, `revokedAt`. Indexed on `[userId, revokedAt]`. |
| `AuditLog` | Append-only history | `actorId?`, `action`, `actionCode`, `method?`, `statusCode?`, `targetUserId?`, `targetLabel?`, IP, UA, `metadata` (JSON). Both user FKs `SetNull`. Indexed on `[actorId, createdAt desc]`, `[targetUserId, createdAt desc]`, `[createdAt desc]`. |

**Enumerations**

```
Role            ADMIN | MANAGER | MEMBER | VIEWER
UserStatus      ACTIVE | INVITED | SUSPENDED
ThemeMode       LIGHT | DARK | SYSTEM
SidebarBehavior OPEN | CLOSED | EXPAND_ON_HOVER
```

- **DR-01** — `User.email` and `User.username` shall be unique. Soft delete shall preserve both
  constraints by rewriting the email and nulling the username (FR-44).
- **DR-02** — `AuditLog` shall be treated as append-only. No code path may update or delete a row.
- **DR-03** — `UserStatus.INVITED` is defined and filterable but **never assigned** by any code
  path; `createUser` hardcodes `ACTIVE`.
- **DR-04** — `User.lastLoginAt` is selected and rendered but **never written**, so the column
  always displays its empty state.

**Migrations**

| Migration | Effect |
|---|---|
| `20260825225617_init` | Original multi-tenant console schema (organizations, projects, domains, `Role` = OWNER/ADMIN/DEVELOPER/READ_ONLY). |
| `20260826090000_users_only` | Hand-ordered SQL dropping the tenancy tables and enums, replacing `Role`, adding `UserStatus`, reshaping `AuditLog` around user targets, and adding `User.role` / `status` / `invitedById` / `lastLoginAt`. |

---

## 4. Appendices

### Appendix A — Environment contract

Server variables are parsed by `lib/env.ts` at import time; the process **throws** if any
required entry is missing or malformed.

| Variable | Required | Consumer | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `prisma.config.ts`, `lib/prisma.ts` | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Auth.js | Generate with `npx auth secret` |
| `AUTH_URL` | — | Auth.js | Required in production; leave unset in development |
| `AUTH_GOOGLE_ID` | — | `auth.config.ts` | Google provider registers only if this **and** the secret are set |
| `AUTH_GOOGLE_SECRET` | — | `auth.config.ts` | — |
| `NEXT_PUBLIC_APP_NAME` | ✅ | `lib/app-config.ts` | Client-safe; falls back to `"Portal"` only if validation is bypassed |
| `NEXT_PUBLIC_APP_DOMAIN` | ✅ | `lib/app-config.ts` | Must be a **bare hostname** (no scheme, no path) |
| `NODE_ENV` | — | `lib/env.ts` | Defaults to `development` |
| `SHADOW_DATABASE_URL` | — | `prisma.config.ts` | Needed for `prisma migrate diff`. **Not present in `.env.example`** — see Appendix C. |

`lib/env.ts` additionally exports `googleEnabled = Boolean(AUTH_GOOGLE_ID && AUTH_GOOGLE_SECRET)`.

### Appendix B — Traceability matrix

| Requirements | Primary implementation |
|---|---|
| FR-10 – FR-13, FR-17 – FR-19, FR-24 | `auth.ts`, `auth.config.ts` |
| FR-13a | `auth.config.ts` (Google `profile()`), `types/next-auth.d.ts` |
| FR-14 – FR-16 | `lib/actions/auth.ts`, `lib/bootstrap.ts` |
| FR-20 – FR-22 | `proxy.ts`, `auth.config.ts` (`isPublicPath`) |
| FR-30 – FR-36 | `lib/permissions.ts` |
| FR-37, FR-38 | `lib/actions/users.ts` (`assertNotLastAdmin`, `loadActionable`) |
| FR-39, FR-39a | `lib/auth/require-session.ts`, `proxy.ts` |
| FR-40 – FR-43 | `lib/actions/users.ts` |
| FR-44 | `lib/auth/deletion.ts` |
| FR-44a | `auth.ts` (`signIn` callback) |
| FR-45 – FR-49 | `lib/queries/users.ts` |
| FR-50, FR-60 | `lib/actions/profile.ts` |
| FR-61 | `lib/auth/deletion.ts`, `lib/actions/profile.ts`, `auth.ts` |
| FR-61a | `lib/auth/deletion.ts`, `lib/auth/require-session.ts` |
| FR-51 – FR-52 | `lib/actions/connections.ts`, `lib/queries/account.ts` |
| FR-53 – FR-56, FR-62 | `lib/actions/security.ts` |
| FR-57 – FR-59 | `lib/actions/tokens.ts`, `lib/auth/tokens.ts` |
| FR-70 – FR-75 | `lib/actions/preferences.ts`, `lib/queries/account.ts` |
| FR-80 – FR-82, FR-85 | `lib/audit.ts` + call sites |
| FR-83 – FR-84, FR-86 | `lib/queries/audit.ts` |
| NFR-30 – NFR-32 | `lib/env.ts`, `lib/app-config.ts` |
| DR-01 – DR-04 | `prisma/schema.prisma` |

### Appendix C — Known deviations

Requirements that the code does not currently satisfy in full. Each is scheduled in
[`ROADMAP.md`](./ROADMAP.md).

| # | Requirement | Deviation |
|---|---|---|
| D-1 | FR-62 | Two-factor authentication is a stored boolean with no secret and no challenge step. |
| D-2 | DR-04 | `lastLoginAt` is displayed but never written. |
| D-3 | FR-71 | `sidebarBehavior` is stored but no sidebar reads it. |
| D-4 | FR-72, FR-73 | `telemetryEnabled`, `editEntitiesInCode` and `queueTableOperations` are stored but inert. |
| D-5 | FR-74, NFR-42 | Only ⌘K is implemented; several shortcut labels name features removed with the tenancy layer. |
| D-6 | §1.2 | API tokens can be minted but no route consumes them; `scopes`, `expiresAt` and `lastUsedAt` are never written or checked. `tokenPreview()` in `lib/auth/tokens.ts` has no callers. |
| D-7 | DR-03 | `UserStatus.INVITED` is unreachable; there is no invitation flow. |
| D-9 | FR-86 | Audit filtering is limited to range and scope; action codes are inline literals with no central definition. |
| D-10 | §2.1 | `/signup` copy still claims registration "creates your organization and a first project". |
| D-11 | §3.4 | `Authenticator` and `VerificationToken` are dead models. |
| D-12 | NFR-25 | No test framework, no CI. |
| D-13 | Appendix A | `SHADOW_DATABASE_URL` is read by `prisma.config.ts` but absent from `.env.example`. |
| D-14 | §2.4 | `package-lock.json` coexists with the authoritative `pnpm-lock.yaml`. |
| D-15 | NFR-20 | `NoticeBanner` renders hardcoded marketing copy with a dead button on every page; `Header`/`AccountHeader` carry non-functional Feedback, Docs and Notifications buttons; `IconSidebar`'s collapse control does nothing and its "Users" item is unconditionally active. |
