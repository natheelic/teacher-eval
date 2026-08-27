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
- **A-3** The deployment is trusted internally. Credentials sign-in and the TOTP code check are
  rate-limited (`lib/auth/rate-limit.ts`, an in-memory per-process counter — see
  docs/ROADMAP.md 5.8), but nothing else is: no CAPTCHA anywhere, and no rate limiting on
  `requestPasswordReset()` or any other endpoint.
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
| `/account/preferences` | `app/account/preferences/page.tsx` | All | Profile, connections, appearance, shortcuts, dashboard, analytics, danger zone. Password change lives on `/account/security` only, reachable via `SettingsSidebar`. |
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
- **FR-16a** — A Credentials registration shall, best-effort, send a verification link to the
  registered email (reusing FR-40a's token mechanism, 24-hour expiry) without blocking or failing
  registration if email is unconfigured or the send fails — verification is never a gate on using
  the account, only a status shown back to the user. `User.emailVerified` shall otherwise be
  stamped without a separate email: automatically for a Google sign-in when the provider's own
  `email_verified` claim is true (`auth.config.ts`'s `profile()`), and on invitation acceptance
  (FR-40b), since clicking a link sent to that address already proves control of it.
  *Implementation:* `lib/auth/email-verification.ts`.
- **FR-16b** — Visiting `/verify-email?token=<token>` shall consume the token (shared mechanism
  with FR-40a) and stamp `emailVerified` on the matching account, or show a clear "invalid or
  expired" message otherwise — verification on render, not behind a button, mirroring how a
  single-use link is conventionally expected to "just work" on click.
  *Implementation:* `app/(auth)/verify-email/page.tsx`, `verifyEmailToken()`.
- **FR-16c** — A user whose email is not yet verified shall be able to trigger a fresh
  verification email from `/account/preferences`, subject to email being configured (FR-40c).
  *Implementation:* `resendVerificationEmail()` in `lib/actions/email-verification.ts`.
- **FR-16d** — Requesting a password reset (`/forgot-password`, email only) shall return the
  identical response — `ok: true`, no message that varies by outcome — whether or not the email
  matches an `ACTIVE` account, to prevent using this form to enumerate accounts (the one flow in
  the app worth that protection, unlike sign-up's "already in use" check, since it's the natural
  target for probing which addresses have accounts). A match sends a reset link (shared token
  mechanism, FR-40a, 1-hour expiry — tighter than FR-16a's 24 hours, since a password reset is
  more sensitive than an address-ownership check). Whether email is configured at all is safe to
  reveal before this check, since that's operational state, not account data.
  *Implementation:* `requestPasswordReset()` in `lib/actions/password-reset.ts`.
- **FR-16e** — Visiting `/reset-password?token=<token>` and submitting a password meeting
  `passwordSchema` shall consume the token; reject with a clear, actionable error if it is
  missing, invalid, expired, or already used; otherwise rehash the password, revoke **every**
  `DeviceSession` for that account (there is no "current session" to exempt, unlike a signed-in
  password change — the requester isn't authenticated yet, same as an admin-initiated reset,
  FR-43), and sign the user in immediately (mirroring FR-14's registration auto-sign-in).
  Audit: `account.password.reset_completed`, distinct from FR-43's admin-initiated
  `user.password.reset`. *Implementation:* `resetPassword()` in `lib/actions/password-reset.ts`.
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

- **FR-40** — An authorised actor shall be able to invite a user by name, email and role, subject
  to FR-35. The system shall reject a duplicate email, generate a unique username, record
  `invitedById` as the actor, create an empty `UserPreferences` row, and create the account with
  `status: INVITED` and **no password** — the actor never sees or sets one. The system shall then
  email the invitee a one-time acceptance link (FR-40a) and require email to be configured (FR-40c)
  before creating anything, so a failed send never leaves an unreachable `INVITED` row behind.
  Audit: `user.invited` (201). *Implementation:* `createUser()` in `lib/actions/users.ts`.
- **FR-40a** — An invitation link shall be single-use and shall expire 7 days after issuance. The
  system shall store it as a SHA-256 hash (`hashToken()`, the same function API tokens use) in the
  Auth.js adapter's existing `VerificationToken` model (`identifier` = the invitee's email,
  `token` = the hash), never the raw value that goes out in the email — consuming a link shall
  delete the matching row so it cannot be replayed. This mechanism is generic, shared with email
  verification (FR-16a) via `createVerificationToken()` / `consumeVerificationToken()` in
  `lib/auth/verification-tokens.ts`; `lib/auth/invitations.ts` uses it with a 7-day expiry,
  `lib/auth/email-verification.ts` with 24 hours.
- **FR-40b** — Visiting `/invite/accept?token=<token>` and submitting a password meeting
  `passwordSchema` (FR-14) shall: consume the token (FR-40a); reject with a clear, actionable
  error if it is missing, invalid, expired, or already used; otherwise set the matching `INVITED`
  account's password, flip `status` to `ACTIVE`, and sign the user in immediately (mirroring
  FR-14's registration auto-sign-in). Audit: `user.invitation.accepted`. *Implementation:*
  `acceptInvitation()` in `lib/actions/invitations.ts`; `app/(auth)/invite/accept/page.tsx`,
  public via `PUBLIC_PREFIXES` in `auth.config.ts` (unauthenticated by design — the invitee has no
  session yet).
- **FR-40c** — Email-dependent features shall be gated on email being configured, rather than
  crashing the app at boot when it isn't. `lib/email.ts` sends through `nodemailer`; local
  development points it at a Mailpit container (`docker-compose.yml`) so invitations can be tested
  without a real mail account — sent mail is caught and viewable at `http://localhost:8025`.

  *Superseded in part by FR-94:* the gate was originally a synchronous `emailEnabled` const derived
  from `SMTP_HOST`/`SMTP_PORT`/`SMTP_FROM` (mirroring how `googleEnabled` gates the Google
  provider). Now that SMTP is configurable at runtime, the check is `await isEmailEnabled()`
  (`lib/email-config.ts`) and the environment triple is only the bootstrap fallback.
- **FR-40d** — An authorised actor shall be able to resend an invitation to a target whose
  `status` is still `INVITED`, generating a fresh token (FR-40a) and email without revoking the
  prior one — it is already single-use and self-expiring. Audit: `user.invitation.resent`.
  *Implementation:* `resendInvitation()` in `lib/actions/users.ts`.
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
  method.** `unlinkProvider` shall refuse when fewer than one method would remain, and the
  Disconnect control in `Connections`/`ConnectionButton` shall be disabled for the same
  condition (`canDisconnect`, computed in `app/account/preferences/page.tsx` from
  `user.hasPassword` and the linked-provider count). Audit: `account.connection.removed`.
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
- **FR-59a** — A machine client presenting a valid token as `Authorization: Bearer <token>` shall
  be able to authenticate to routes under `app/api/` without a session. The system shall hash the
  presented value and look it up by `tokenHash`, and shall reject it — uniformly, as a 401, without
  distinguishing the reason — if it is unknown, revoked, expired, or belongs to a deleted or
  suspended account. `GET /api/me` is the first such route, returning the token holder's identity.
  A successful authentication stamps `ApiToken.lastUsedAt`, fired without awaiting so the write
  cannot add latency to or fail the request it authenticates.
- **FR-59b** — A user minting a token shall be able to choose an expiration (no expiration, 7, 30,
  90, or 365 days) from the creation form; the system shall resolve this to `ApiToken.expiresAt` at
  creation time and never accept an absolute date from the client directly. The token list shall
  display each token's expiration state (no expiration, upcoming, or already expired).
- **FR-59c** — `ApiToken.scopes` shall be drawn from a controlled vocabulary
  (`lib/auth/scopes.ts`'s `API_TOKEN_SCOPES`), not free-form strings; a user minting a token shall
  choose which scopes to grant it (all checked by default) from the creation form, and a value
  outside the vocabulary shall be silently dropped rather than accepted. Each route under
  `app/api/` shall declare the scope it requires and reject a token lacking it with `403`,
  distinct from the `401` returned for a token that fails FR-59a's authentication checks. `GET
  /api/me` requires `identity:read`. The token list shall display each token's granted scopes,
  with an explicit warning when a token has none.

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

- **FR-62** — A user may enable TOTP two-factor authentication from `/account/security`: the
  server generates a secret and shows it as a QR code and a manual key, and only writes
  `User.twoFactorSecret` / sets `twoFactorEnabled` once the user confirms one valid 6-digit code
  — nothing is persisted from an abandoned enrollment. A user with 2FA enabled must supply a
  valid code, in addition to their password, to sign in via the Credentials provider; **Google
  (OAuth) sign-in is not gated by this control** — 2FA here is tied to the password path, which
  is the only one with a "current credential" concept to attach a second factor to. Disabling
  requires the account's current password (or is unconditional for an OAuth-only account with no
  password) and clears both fields. Audit: `account.2fa.enabled` / `account.2fa.disabled`.
  *Implementation:* `lib/auth/totp.ts`, `lib/actions/twoFactor.ts`,
  `components/account/TwoFactorSettings.tsx`, the `authorize()`/`TwoFactorRequired` handling in
  `auth.ts`.

#### FR-5x — Preferences

*Implemented in `lib/actions/preferences.ts`; every action calls `requireUser()` and upserts
`UserPreferences`.*

- **FR-70** — A user shall be able to set their theme to `LIGHT`, `DARK` or `SYSTEM`.
  `UserPreferences.theme` is authoritative; `localStorage` is a paint-blocking cache.
  `useSyncedTheme` shall write `localStorage` first, then the database.
- **FR-75** — Preferences reads shall fall back to the schema defaults when no row exists.

FR-71 – FR-74 (`sidebarBehavior`, `telemetryEnabled`, the `editEntitiesInCode`/
`queueTableOperations` dashboard flags, and per-shortcut keyboard toggles) were removed rather
than implemented — none had any reader anywhere in the app, and several named features already
deleted with the old multi-tenancy layer. `UserPreferences` now has only `theme`; see
`docs/ROADMAP.md` Phase 1 (1.3 – 1.5).

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
- **FR-84a** — The audit view shall support filtering by `actionCode` (validated against
  `ACTION_CODES`; an unrecognized value is ignored rather than erroring) and by a free-text
  `target` query matched case-insensitively against the denormalised `targetLabel` (FR-82),
  capped at 100 characters. Both compose with FR-83's range and FR-84's scope, and both reset
  cursor pagination when changed. *Implementation:* `getAuditLogs()` / `parseAuditFilters()` in
  `lib/queries/audit.ts`; `ACTION_CODES` itself lives in `lib/action-codes.ts` — split out from
  `lib/audit.ts` so the vocabulary can be imported by the Client Component filter UI without
  pulling `lib/audit.ts`'s `next/headers`/Prisma imports into the browser bundle.
- **FR-85** — The system shall record only a code drawn from the closed vocabulary
  `ACTION_CODES` (`lib/audit.ts`) — `AuditInput.actionCode` is typed against it, so a call site
  passing anything outside the list fails to typecheck rather than silently writing an
  unfilterable row:

  | Code | Meaning |
  |---|---|
  | `account.created` | Registration (annotated as the first/admin account when applicable) |
  | `account.profile.updated` | Name or username changed |
  | `account.password.changed` | Own password changed (or set, for an OAuth-only account) |
  | `account.password.reset_requested` / `account.password.reset_completed` | Self-service forgot-password lifecycle (FR-16d – FR-16e) |
  | `account.2fa.enabled` / `account.2fa.disabled` | Two-factor flag flipped |
  | `account.session.revoked` | One device session revoked |
  | `account.session.revoked_all` | All other device sessions revoked |
  | `account.connection.removed` | OAuth provider unlinked |
  | `account.token.created` / `account.token.revoked` | API token lifecycle |
  | `account.deletion.requested` / `account.deletion.cancelled` | Self-deletion request lifecycle |
  | `user.invited` | Account invited via the admin surface (FR-40) |
  | `user.invitation.accepted` | Invitee activated their account (FR-40b) |
  | `user.invitation.resent` | An admin resent an invitation (FR-40d) |
  | `user.role.changed` | Target's role changed |
  | `user.suspended` / `user.reactivated` | Target's status changed |
  | `user.password.reset` | Target's password reset by an administrator |
  | `user.deleted` | Target soft-deleted |

- **FR-86** — Filtering by `actionCode` and target is implemented (FR-84a). Method and status
  code are surfaced directly on each row (not separately filterable). IP address, user agent and
  `metadata` are surfaced in a per-row expandable detail rather than as columns or filters —
  clicking a row with any of the three present toggles a detail line below it; a row with none of
  them (only possible outside a request context, e.g. the grace-period deletion sweep) renders no
  chevron and isn't clickable. `metadata` itself is schema-supported but no call site populates it
  yet — the detail view renders it (pretty-printed JSON) whenever a future one does, without
  needing UI changes. *Implementation:* `AuditLogRow.tsx`, `getAuditLogs()` in
  `lib/queries/audit.ts`.
- **FR-87** — An "Export CSV" control shall download the audit log matching the **current
  filters** (range, scope, action code, target) as RFC 4180 CSV — one column each for date
  (formatted, not raw ISO), action code, the human action sentence, method, status, actor, target,
  IP address and user agent. Export is capped at 5,000 rows (newest first) and is not paginated —
  it always covers the whole filtered range in one file, not just the loaded page. Authorization
  and scope enforcement are identical to the paginated view (`getAuditLogsForExport()` shares
  `getAuditLogs()`'s `requireUser()` + scope-clamping logic, not just its shape).
  *Implementation:* `GET app/account/audit-logs/export/route.ts`, `lib/csv.ts`.
  *Route placement note:* deliberately **not** under `app/api/` — this route needs the
  session-cookie protection the proxy already gives every non-public page, not the bearer-token
  model `app/api/` routes use (`PUBLIC_PREFIXES` excludes it, so an unauthenticated request is
  redirected to `/signin` before the handler runs, verified with `curl`).

#### FR-9x — Feedback

*Implemented in `lib/actions/feedback.ts`.*

- **FR-90** — A signed-in user shall be able to submit free-text feedback (1–2000 characters)
  from any page, via the Feedback control in the account header. It is stored in a dedicated
  `Feedback` row (`userId`, `message`, `createdAt`); `userId` is `SetNull` on account deletion, so
  the row survives. Not written to `AuditLog`; it isn't a security-relevant action. Viewable
  (read-only, most recent first, capped at 100 rows) by admins at `/admin` (FR-91/FR-92's panel).

#### FR-9x — Admin panel

*`docs/ROADMAP.md` Phase 6. `ADMIN`-only via `requireAdmin()` in `lib/auth/require-session.ts`
(stricter than `requireUserManager()` — a manager is redirected to `/dashboard`, not shown the
page or `/account/preferences`).*

- **FR-91** — An `ADMIN` shall be able to upload a PNG, JPEG, or WebP image (≤2MB) at `/admin` to
  replace the built-in logo shown across the app; removing it restores the default. Stored on
  disk under `public/uploads` (`lib/logo-storage.ts`) with the resulting path in a singleton
  `AppSettings.logoUrl` row, read by every page that renders `AppLogo`. `image/svg+xml` is
  rejected — an SVG served from the app's own origin executes embedded script if a browser is
  ever pointed at the file directly, unlike an `<img src>` reference.
  *Deployment note:* this assumes the same long-lived Node server `/docs` already assumes reading
  a file off disk at request time (A-3 territory) — it does not survive a serverless target with
  no durable local disk.
- **FR-92** — An `ADMIN` shall be able to publish, edit, or deactivate a single announcement
  message, shown to every signed-in user (via `Header`/`AccountHeader`) until they individually
  dismiss it. At most one `Announcement` row is `active` at a time; deactivating clears it for
  every user immediately, regardless of who has or hasn't dismissed it. A user's dismissal is a
  single `User.dismissedAnnouncementId` pointer to the announcement they last dismissed, not a
  growing list — sufficient because there is no "reactivate," so a user only ever needs to know
  whether they've dismissed *the current* one. Not written to `AuditLog` on dismissal (not
  security-relevant, same reasoning as FR-90); publishing/editing and deactivating are audited
  under `announcement.saved` and `announcement.deactivated` respectively.

- **FR-93** — An `ADMIN` shall be able to change the displayed product name at `/admin/branding`.
  The name is stored in `AppSettings.appName` and resolved by `getAppSettings()`
  (`lib/queries/settings.ts`) against the `NEXT_PUBLIC_APP_NAME` fallback, so a null or blank
  stored value yields the environment value and no call site handles null. It applies to page
  chrome, `<title>` metadata, the landing and terms pages, and every outbound email. Audited as
  `settings.app_name.updated`.

  *Deliberate deviation:* the TOTP issuer (`lib/auth/totp.ts`'s `buildOtpAuthUrl()`) shall **not**
  follow this setting, continuing to use the build-time `NEXT_PUBLIC_APP_NAME`. The issuer is
  written once into a third-party authenticator application and cannot be updated afterwards;
  changing it would not invalidate any credential (verification reads only the secret) but would
  leave a permanently inconsistent list of entries with no migration path.

- **FR-94** — An `ADMIN` shall be able to configure the SMTP server at `/admin/email` — host,
  port, From address, and optional username and password — superseding the `SMTP_*` environment
  variables (FR-40c), which become bootstrap defaults for a fresh install.

  Resolution (`lib/email-config.ts`) shall be **all-or-nothing on each side**: a complete stored
  triple (host, port, From) wins outright; otherwise a complete environment triple wins; otherwise
  email is disabled. The two shall never be merged, since a partially-saved configuration would
  otherwise send mail from an unintended `From` address.

  The password shall be encrypted at rest (AES-256-GCM, `lib/secret-box.ts`, key derived from
  `AUTH_SECRET`) and shall never be returned to the client: the admin view
  (`lib/queries/email-settings.ts`) exposes only `hasPassword` and `passwordDecryptable` booleans,
  a blank password field on submit means "leave unchanged" rather than "delete", and audit
  metadata records `{ host, port, from, user, passwordChanged }` and never the password or its
  ciphertext — `AuditLog.metadata` is exported to CSV (FR-88) and would otherwise carry the secret
  out of the application.

  A stored password that fails to decrypt shall fail **soft**: it degrades to an unauthenticated
  connection and the condition is surfaced at `/admin/email` for recovery, rather than throwing
  and taking down every page that renders application chrome. Audited as `settings.email.updated`
  and `settings.email.cleared`.

- **FR-94b** — The email configuration screen shall offer a provider picker drawn from a closed
  vocabulary (`lib/email-providers.ts`): Gmail, Outlook/Microsoft 365, Resend, SendGrid, Mailpit,
  and Custom. Every provider is reached over SMTP — Resend and SendGrid accept an API key as the
  SMTP password against a fixed username — so no additional transport is introduced.

  The hostname, port, and any fixed username shall be resolved **server-side** from that table and
  never accepted from the request, so a tampered submission cannot point a recognised provider id
  at a different server. Only the Custom provider reads a hostname and port from the form.
  `AppSettings.smtpProvider` records the selection solely for redisplay and credential labelling;
  the resolved values are written to the existing SMTP columns, leaving FR-94's resolution
  unchanged.

- **FR-94a** — An `ADMIN` shall be able to send a test message from `/admin/email` to verify the
  configuration. It tests the **saved** configuration, not unsubmitted form values, so that the
  test cannot diverge from what the application actually sends. The transport error, if any, shall
  be surfaced verbatim — this is an administrator-only surface and the underlying message is the
  diagnostic value. Audited as `settings.email.test_sent`.

- **FR-95** — The admin panel shall be organised as sub-routes (`/admin/branding`,
  `/admin/announcements`, `/admin/email`, `/admin/feedback`) with persistent sub-navigation.
  `/admin` shall apply the `ADMIN` guard before redirecting, so an unauthorised user is redirected
  to their default landing page directly rather than by way of a sub-route.

- **FR-31a** — Navigation shall not present links the current user's role cannot follow. Where a
  route guard redirects a role away (FR-31: `MEMBER`/`VIEWER` from `/users`, non-`ADMIN` from
  `/admin`), the corresponding navigation item shall be hidden for that role. Visibility is passed
  in by each page rather than derived inside the navigation component, and defaults to hidden, so
  that a new call site fails closed.

  *Known gap:* the ⌘K command palette (`components/search/search-data.ts`) is a static list and
  still offers `/users` to every role. This is a presentation inconsistency, not an authorisation
  defect — the route guard still applies. See Appendix C.

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
- **NFR-42** — A command palette shall be reachable with ⌘K, searching live users and audit log
  entries in addition to the static navigation list — `components/search/CommandPalette.tsx`,
  `lib/actions/search.ts`, `lib/queries/users.ts`'s `searchUsersForPalette()`,
  `lib/queries/audit.ts`'s `searchAuditLogsForPalette()`.

---

### 3.4 Data requirements

Defined in `prisma/schema.prisma`. PostgreSQL; ids are cuids unless noted.

| Model | Purpose | Notes |
|---|---|---|
| `User` | The central entity | Identity, `emailVerified`, `role`, `status`, `passwordHash`, `twoFactorEnabled`/`twoFactorSecret`, `deletionRequestedAt`, `deletedAt`, `lastLoginAt`, self-relation `invitedBy`/`invitees` (`SetNull`). Indexed on `role`, `status`, `createdAt desc`, `deletionRequestedAt`. |
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
- **DR-02** — `AuditLog` shall be treated as append-only by application code. No Server Action,
  route handler, or query may update or delete a row. This governs ordinary request-handling code
  only; a deliberately-scoped retention job (DR-05), if one is ever built, is the sole intended
  exception, not a violation of it.
- **DR-03** — `UserStatus.INVITED` shall be assigned by `createUser()` and cleared to `ACTIVE`
  only by a successful `acceptInvitation()` (FR-40, FR-40b) — the only two code paths permitted to
  write it.
- **DR-04** — `User.lastLoginAt` shall be stamped with the current time on every successful
  sign-in (Credentials and OAuth alike), from the `jwt` callback's initial-sign-in branch in
  `auth.ts` — the same place `DeviceSession` creation and pending-deletion cancellation already
  run, so it fires exactly once per new session rather than once per request.
- **DR-05** — **[NOT ENFORCED]** `AuditLog` has no retention or archival policy and grows without
  bound (ROADMAP 4.5). Recommendation, not yet implemented: retain rows for **365 days** from
  `createdAt`, then archive or hard-delete — a common security-log baseline (e.g. the retention
  window several SOC 2-style frameworks expect) that comfortably covers this app's own longest
  built-in look-back (`AuditRange`'s `30d`, FR-83). Deliberately left unenforced rather than
  half-built: enforcing it needs a recurring job, and this app has **no scheduled-job
  infrastructure at all** — the one other time-based cleanup here (the 30-day account-deletion
  grace period, FR-61a) works by piggybacking on `requireUser()`, a chokepoint every authenticated
  request already passes through, but `AuditLog` rows have no equivalent per-row request trigger
  to piggyback on. Building a cron/job runner just for this would be disproportionate to every
  other item in this phase. Revisit once the app has scheduled-job infrastructure for any reason.

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
| `NEXT_PUBLIC_APP_NAME` | ✅ | `lib/app-config.ts` | Client-safe. Now the **fallback** display name (FR-93) and the TOTP issuer; the shown name is `AppSettings.appName` when set |
| `NEXT_PUBLIC_APP_DOMAIN` | ✅ | `lib/app-config.ts` | Must be a **bare hostname** (no scheme, no path) |
| `NODE_ENV` | — | `lib/env.ts` | Defaults to `development` |
| `SHADOW_DATABASE_URL` | — | `prisma.config.ts` | Needed for `prisma migrate diff`. **Not present in `.env.example`** — see Appendix C. |

`lib/env.ts` additionally exports `googleEnabled = Boolean(AUTH_GOOGLE_ID && AUTH_GOOGLE_SECRET)`.

The `SMTP_*` variables are **bootstrap defaults** only (FR-94): they apply until an `ADMIN` saves
SMTP settings at `/admin/email`, after which the stored configuration wins outright. There is
deliberately no `emailEnabled` export — the answer now depends on the database, so callers use
`await isEmailEnabled()` from `lib/email-config.ts`.

### Appendix B — Traceability matrix

| Requirements | Primary implementation |
|---|---|
| FR-10 – FR-13, FR-17 – FR-19, FR-24 | `auth.ts`, `auth.config.ts` |
| FR-13a | `auth.config.ts` (Google `profile()`), `types/next-auth.d.ts` |
| FR-14 – FR-16 | `lib/actions/auth.ts`, `lib/bootstrap.ts` |
| FR-16a – FR-16c | `lib/auth/email-verification.ts`, `lib/actions/email-verification.ts`, `app/(auth)/verify-email/page.tsx`, `auth.config.ts` |
| FR-16d – FR-16e | `lib/auth/password-reset.ts`, `lib/actions/password-reset.ts`, `app/(auth)/{forgot-password,reset-password}/page.tsx` |
| FR-20 – FR-22 | `proxy.ts`, `auth.config.ts` (`isPublicPath`) |
| FR-30 – FR-36 | `lib/permissions.ts` |
| FR-37, FR-38 | `lib/actions/users.ts` (`assertNotLastAdmin`, `loadActionable`) |
| FR-39, FR-39a | `lib/auth/require-session.ts`, `proxy.ts` |
| FR-40, FR-40d, FR-41 – FR-43 | `lib/actions/users.ts` |
| FR-40a, FR-40c | `lib/auth/verification-tokens.ts`, `lib/auth/invitations.ts`, `lib/email.ts`, `lib/url.ts`, `lib/env.ts` |
| FR-40b | `lib/actions/invitations.ts`, `app/(auth)/invite/accept/page.tsx` |
| FR-44 | `lib/auth/deletion.ts` |
| FR-44a | `auth.ts` (`signIn` callback) |
| FR-45 – FR-49 | `lib/queries/users.ts` |
| FR-50, FR-60 | `lib/actions/profile.ts` |
| FR-61 | `lib/auth/deletion.ts`, `lib/actions/profile.ts`, `auth.ts` |
| FR-61a | `lib/auth/deletion.ts`, `lib/auth/require-session.ts` |
| FR-51 – FR-52 | `lib/actions/connections.ts`, `lib/queries/account.ts` |
| FR-53 – FR-56 | `lib/actions/security.ts` |
| FR-62 | `lib/auth/totp.ts`, `lib/actions/twoFactor.ts`, `auth.ts` |
| FR-57 – FR-59 | `lib/actions/tokens.ts`, `lib/auth/tokens.ts` |
| FR-59a | `lib/auth/api-token.ts`, `app/api/me/route.ts` |
| FR-59b | `lib/actions/tokens.ts`, `components/account/AccessTokensTable.tsx` |
| FR-59c | `lib/auth/scopes.ts`, `lib/auth/api-token.ts`, `app/api/me/route.ts` |
| FR-70, FR-75 | `lib/actions/preferences.ts`, `lib/queries/account.ts` |
| FR-80 – FR-82, FR-85 | `lib/audit.ts` + call sites |
| FR-83 – FR-84a, FR-86 | `lib/queries/audit.ts`, `lib/action-codes.ts`, `components/account/{AuditLogFilters,AuditLogRow}.tsx` |
| FR-87 | `app/account/audit-logs/export/route.ts`, `lib/csv.ts` |
| FR-90 | `lib/actions/feedback.ts`, `components/dashboard/FeedbackDialog.tsx`, `lib/queries/feedback.ts`, `components/admin/FeedbackList.tsx` |
| FR-91 | `lib/logo-storage.ts`, `lib/queries/settings.ts`, `lib/actions/settings.ts`, `components/admin/LogoSettings.tsx`, `components/dashboard/AppLogo.tsx` |
| FR-92 | `lib/actions/announcements.ts`, `lib/queries/announcements.ts`, `components/admin/AnnouncementSettings.tsx`, `components/dashboard/AnnouncementBanner.tsx` |
| FR-93 | `lib/queries/settings.ts`, `lib/actions/settings.ts`, `components/admin/AppNameSettings.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/terms/page.tsx`, `lib/auth/totp.ts` (deviation) |
| FR-94, FR-94a, FR-94b | `lib/email-providers.ts`, `lib/email-config.ts`, `lib/secret-box.ts`, `lib/queries/email-settings.ts`, `lib/actions/email-settings.ts`, `components/admin/EmailSettings.tsx`, `lib/email.ts` |
| FR-95 | `app/admin/page.tsx`, `app/admin/{branding,announcements,email,feedback}/page.tsx`, `components/admin/AdminSidebar.tsx`, `components/layout/SidebarNavLink.tsx` |
| FR-31a | `components/dashboard/IconSidebar.tsx`, `app/dashboard/page.tsx`, `app/users/page.tsx` |
| NFR-30 – NFR-32 | `lib/env.ts`, `lib/app-config.ts` |
| DR-01 – DR-04 | `prisma/schema.prisma` |
| DR-05 | `docs/ROADMAP.md` (4.5) — documented, not enforced |

### Appendix C — Known deviations

Requirements that the code does not currently satisfy in full. Each is scheduled in
[`ROADMAP.md`](./ROADMAP.md).

| # | Requirement | Deviation |
|---|---|---|
| D-11 | §3.4 | `Authenticator` is a dead model — no WebAuthn. |
| D-12 | NFR-25 | No test framework, no CI. |
| D-13 | Appendix A | `SHADOW_DATABASE_URL` is read by `prisma.config.ts` but absent from `.env.example`. |
| D-14 | §2.4 | `package-lock.json` coexists with the authoritative `pnpm-lock.yaml`. |
| D-15 | DR-05 | `AuditLog` has no retention/archival enforcement — a 365-day policy is documented but not implemented, since it would need scheduled-job infrastructure this app doesn't have anywhere else. |
| D-16 | FR-31a | The ⌘K command palette (`components/search/search-data.ts`) is a static list and still offers `/users` to every role. Presentation only — the route guard still redirects. Fixing it needs the role inside `SearchProvider`, rendered from a root layout that must not read a session (it would make every route dynamic and undo the static prerendering of `/` and `/terms`). |
| D-17 | FR-94, NFR-01 | `AUTH_SECRET` now has two dependents — the 2FA secret and the stored SMTP password — with no key-rotation story. Rotating it invalidates both. The SMTP half fails soft and is recoverable by re-entering the password; the 2FA half is not. |
| D-18 | FR-93 | `appDomain` in `lib/app-config.ts` has no consumers anywhere in the codebase. A deletion candidate. |
