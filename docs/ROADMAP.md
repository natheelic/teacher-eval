# Roadmap

Where Portal is, and what it needs next. Every item below is derived from the actual state of the
code — nothing here is aspirational filler. Requirement identifiers (`FR-nn`) and deviation
identifiers (`D-n`) refer to [`SRS.md`](./SRS.md).

**Ordering principle:** the highest-value work is not new features. It is closing the gap between
what the interface *claims* and what the system *does*. A toggle that persists a boolean nothing
reads is worse than no toggle at all — it misleads the person using it.

---

## Phase 0 — Shipped ✅

Complete and working today.

- ✅ **Credentials authentication** with case-insensitive email, constant-work verification, and
  rejection of soft-deleted accounts — `auth.ts`
- ✅ **Optional Google OAuth**, registered only when both credentials are configured, with
  dangerous email linking disabled — `auth.config.ts`
- ✅ **Bootstrap admin**: the first account created becomes `ADMIN`, making a fresh database
  usable — `lib/bootstrap.ts`
- ✅ **Role-based authorization** with the escalation guards intact: no self-action, managers act
  only on strictly lower ranks, managers assign only below their own rank, delete is admin-only,
  and the last active admin cannot be demoted, suspended or deleted — `lib/permissions.ts`,
  `lib/actions/users.ts`
- ✅ **Single authorization boundary** — `requireUser()` is the only place revocation, suspension
  and deletion are enforced, so all three take effect on the very next request —
  `lib/auth/require-session.ts`
- ✅ **User administration**: create, change role, suspend/reactivate, reset password, soft delete
  with email rewriting — `lib/actions/users.ts`
- ✅ **Users table** with search, role and status filters, cursor pagination, and unfiltered
  population stats — `lib/queries/users.ts`, `components/users/`
- ✅ **Device sessions** — created on sign-in, labelled from the user agent, listable, revocable
  individually or in bulk, and revoked automatically on suspension and password change
- ✅ **API token issuance** — SHA-256 storage, one-time plaintext reveal, masked preview,
  revocation — `lib/actions/tokens.ts`
- ✅ **Audit log** with 18 action codes, best-effort writes that can never fail the underlying
  operation, and scope enforcement that constrains non-managers to their own rows even when they
  request `scope=all` — `lib/audit.ts`, `lib/queries/audit.ts`
- ✅ **Preferences** persisted per user, with theme applied before first paint via a
  paint-blocking script and a `localStorage` cache — `lib/actions/preferences.ts`
- ✅ **Mobile navigation** and a ⌘K command palette shell

---

## Phase 1 — Close the honesty gaps 🔴

**Why first:** every item here is a control that a user can operate and reasonably believe took
effect, when it did not. This is the only category of defect in the codebase that actively
misleads. None of it is large work.

| # | Item | Why | Files |
|---|---|---|---|
| 1.1 | ✅ **`lastLoginAt` written** on successful authentication | The users table renders this column; administrators can now tell an abandoned account from an active one. Stamped in the `jwt` callback's initial-sign-in branch (Credentials and OAuth alike), alongside `DeviceSession` creation. | `auth.ts` |
| 1.2 | ✅ **Two-factor authentication implemented for real** — TOTP enrollment (QR + manual key + confirm code before anything is persisted), a sign-in challenge step on the Credentials path, and a password-confirmed disable flow | Done — see FR-62. Google sign-in is deliberately not gated by this. | `lib/auth/totp.ts`, `lib/actions/twoFactor.ts`, `components/account/TwoFactorSettings.tsx`, `auth.ts` |
| 1.3 | ✅ **`sidebarBehavior` removed** — dropped rather than wired up | Nothing ever read it (D-3, FR-71); the `UserPreferences` column and `SidebarBehavior` enum are gone. | — |
| 1.4 | ✅ **`telemetryEnabled`, `editEntitiesInCode`, `queueTableOperations` removed** | Three inert switches (D-4), dropped rather than implemented — no telemetry client, no code-editor mode, no batched edits exist anywhere in the app to wire them to. | — |
| 1.5 | ✅ **Keyboard shortcuts section removed** | The list was hardcoded, several entries named features deleted with the tenancy layer ("New project", "Publish OAuth app", "Add project connection"), and none of the 13 toggles — including the one for ⌘K — were ever read; ⌘K itself is hardcoded in `CommandPalette.tsx` independent of the toggle and is unaffected (D-5). | — |
| 1.6 | ✅ **Fixed stale copy on `/signup`** — no longer promises the account "creates your organization and a first project" | Directly contradicted what the product does; replaced with neutral copy (D-10, resolved). | `app/(auth)/signup/page.tsx` |
| 1.7 | ✅ **`NoticeBanner` removed** | It showed fixed marketing copy claiming an in-progress Terms of Service update, forever, on every page — and its dismissal wasn't persisted, so it reappeared on every navigation. This is properly an admin-authored-announcement feature, which needs the same admin panel the logo-upload and feedback-viewing items are waiting on — deferred there as 6.3 rather than rebuilt as a one-off. Deleted the hardcoded version now rather than leave it lying to users in the meantime. | — |
| 1.8 | ✅ **Dead chrome wired or removed** — `Header`'s Feedback and Docs buttons now use the same real `FeedbackDialog`/`/docs` link `AccountHeader` already had; its Notifications (Bell) button was removed outright, since no notification feature exists anywhere to wire it to; `IconSidebar`'s decorative collapse control (no collapsed state existed anywhere) was removed the same way. The "Users" nav item was already correctly conditional on `pathname` — that part of D-15 no longer described the code. | Done (D-15, resolved). | `components/dashboard/{Header,IconSidebar}.tsx` |

**Exit criteria:** no control in the interface persists state that nothing reads, and no copy
describes a capability the system lacks.

---

## Phase 2 — Make API tokens real 🟠

**Why:** tokens are fully implemented on the issuing side — hashing, preview, revocation, audit —
and completely unimplemented on the consuming side. Nothing authenticates with them, so the
feature currently produces secrets that do nothing (D-6).

- **2.1** ✅ Bearer-token authentication path added: `authenticateApiToken(request)` in
  `lib/auth/api-token.ts` hashes the presented token via the existing `hashToken()`, looks it up
  by the unique `tokenHash`, and rejects a missing/malformed header, an unknown hash, a revoked
  token, an expired one, or one belonging to a deleted/suspended account — mirroring
  `getCurrentUser()`'s account-state checks. Returns `null` uniformly rather than distinguishing
  the failure reason. Scopes are returned but not enforced (2.5).
- **2.2** ✅ `GET /api/me` (`app/api/me/route.ts`) is the first machine route this path protects —
  returns the token holder's id/email/role/status, or 401 with `WWW-Authenticate: Bearer`. Wiring
  it up surfaced a real bug: the proxy's session-redirect gate covered `/api/*` too, so an
  unauthenticated machine request was 307-redirected to the HTML `/signin` page before the route
  handler ever ran — `PUBLIC_PREFIXES` in `auth.config.ts` only excluded `/api/auth`. Widened it to
  `/api`, since every route under `app/api/` (NextAuth's own handlers included) already owns its
  authentication and its own 401/error response; the proxy's redirect-based gate was never the
  right mechanism for a machine client. Verified end-to-end: minted a real token via
  `/account/access-tokens`, confirmed `GET /api/me` with it returns 200 with the right identity,
  confirmed a request with no token or a garbage token gets 401 (not a redirect), and confirmed
  revoking the token immediately breaks it. Session-gated pages (e.g. `/dashboard`) still redirect
  to `/signin` as before — only `/api/*` changed.
- **2.3** ✅ `authenticateApiToken()` now writes `ApiToken.lastUsedAt` on each successful
  authentication, fired without awaiting so the write never adds latency to (or, on failure, ever
  breaks) the request it's authenticating — mirroring `touchDeviceSession()`'s best-effort pattern
  in `require-session.ts`. The `/account/access-tokens` list already read this column (it was one
  of the stored-but-never-written fields), so it now shows "Last used: just now" without any UI
  change needed.
- **2.4** ✅ The creation form (`AccessTokensTable.tsx`) now offers an "Expiration" `<select>`
  (No expiration / 7 / 30 / 90 / 365 days) alongside the name field; `createApiToken()` resolves it
  server-side to an `expiresAt` timestamp (an unrecognized or missing value — including a tampered
  request — falls back to "never expires" rather than erroring, since it's a closed set driven by
  a `<select>`, not free text). `authenticateApiToken()` already enforced `expiresAt` from 2.1; the
  token list now also renders it ("Expires 2 Sept 2026" / "No expiration" / "Expired 25 Aug 2026"
  in red), with the expired/not-expired comparison deferred to after hydration
  (`useSyncExternalStore`, the same pattern `RelativeTime` uses) so the server render and the
  client's hydration pass can't disagree about whether "now" has crossed the threshold.
- **2.5** ✅ `lib/auth/scopes.ts` defines the controlled vocabulary — `API_TOKEN_SCOPES`, currently
  just `identity:read` — as the single source of truth, so the column can't accumulate ad-hoc
  strings as more routes are added. The creation form renders a checkbox per entry (defaulting to
  checked, so a freshly minted token works out of the box); `createApiToken()` filters submitted
  values against the vocabulary before writing `ApiToken.scopes`, silently dropping anything
  unrecognized (a tampered request just doesn't get that scope, rather than erroring). `GET
  /api/me` calls the new `hasScope(auth, "identity:read")` and returns `403` (not `401` — the
  token is valid, just not permitted) when it's missing. The token list shows each token's scopes,
  with an explicit warning ("No scopes — every route will reject this token") when empty.
  **Found and left in place, not fixed (out of scope for this item):** the creation dialog's
  `showDialog = dialogOpen && !state.plaintext` never re-opens after the first successful mint in
  a session, since `useActionState`'s `state.plaintext` only clears when the action runs again —
  which it can't, because the dialog won't show. A page reload works around it. Pre-existing, not
  introduced by 2.1–2.5; worth its own item.
- **2.6** ✅ `lib/queries/account.ts` now calls `tokenPreview()` instead of re-inlining its exact
  logic (`` `${prefix}_${"•".repeat(8)}${last4}` ``); the duplicate expression is gone, output is
  unchanged.

**Exit criteria:** a token minted in the UI can authenticate a request, and its `lastUsedAt`
updates.

---

## Phase 3 — Account lifecycle 🟡

**Why:** three schema features describe a lifecycle the code does not implement. Each requires
email transport, which the system did not have — the first decision in this phase was whether to
add a mail dependency at all. **Decided: yes** (3.1's implementation). 3.2 and 3.3 can now build
on the same transport rather than re-litigating the question.

- **3.1** ✅ **Invitations.** `createUser()` now invites rather than creates directly: it sets
  `status: INVITED` with **no password** (the admin never sees or sets one) and emails a one-time
  acceptance link. Accepting it (`/invite/accept`, public) sets the invitee's own password, flips
  `status` to `ACTIVE`, and signs them in immediately — mirroring sign-up's create-then-`signIn()`
  shape. A manager/admin can resend the invite to any still-`INVITED` row from the row actions
  menu, which correctly shows "Resend invite" there instead of "Reset password" (there's no
  password yet to reset). `D-7` resolved (FR-40, FR-40a – FR-40d).
  - **Email transport chosen:** `nodemailer` against SMTP, gated behind `emailEnabled`
    (`SMTP_HOST`/`SMTP_PORT`/`SMTP_FROM`, mirroring how `googleEnabled` gates Google) rather than a
    hosted-API provider (Resend, Postmark, …) — this app runs as a long-lived Node server, not a
    serverless/edge target, so there's no runtime constraint pushing toward a fetch-based API, and
    plain SMTP means local dev needs no third-party account: `docker-compose.yml` runs Mailpit,
    caught mail viewable at `http://localhost:8025`. Swapping to a hosted provider later is a
    `lib/email.ts` change, not an application-wide one.
  - **Token storage:** reused the Auth.js adapter's existing `VerificationToken` model
    (`identifier`/`token`/`expires`) rather than a new table — it already exists, unused, in the
    schema (no Email provider is registered). Stored as a `hashToken()` hash, one-time (deleted on
    consumption), 7-day expiry.
  - **Verified end-to-end in Chrome + Mailpit:** invited a real address, confirmed the `INVITED`
    badge (previously unreachable) rendered, opened the actual sent email, followed its link,
    activated the account, landed auto-signed-in on `/dashboard` with the audit trail correct on
    both sides (`user.invited` for the inviter, `user.invitation.accepted` for the invitee).
    Re-visiting the same link afterward correctly showed "This invitation link is invalid or has
    expired." Resending produced a second, independent email.
- **3.2** ✅ **Email verification.** `emailVerified` is now stamped on every path that can prove
  address control: a Credentials sign-up sends a best-effort verification link (never a gate on
  using the account — a fresh install with no SMTP configured yet, or a transient send failure,
  must not block registration); a Google sign-in stamps it directly from the provider's own
  `email_verified` claim (no link needed — Google already checked); accepting an invitation stamps
  it too, since clicking a link mailed to that address is already proof. `/account/preferences`
  shows "Verified" / "Not verified" + a resend action for the unverified case.
  - **Token machinery generalized rather than duplicated:** `lib/auth/invitations.ts`'s
    create/consume-token logic moved to a new `lib/auth/verification-tokens.ts` (generic
    `createVerificationToken(email, ttlMs)` / `consumeVerificationToken()`), which both
    invitations (7-day expiry) and email verification (24-hour) now call — same primitive, two
    TTLs, no copy-pasted hashing/expiry logic. `lib/email.ts` gained a shared `escapeHtml()` for
    both email templates.
  - **`/verify-email?token=...` verifies on render, not behind a button** — a plain async
    function call from a Server Component, not a `"use server"` action, matching how
    `requireUser()`'s own soft-delete-on-expiry already establishes that a state-changing side
    effect triggered by navigation (not a form submit) is an accepted pattern here. A single-use
    link is conventionally expected to "just work" on click.
  - **Verified end-to-end in Chrome + Mailpit:** signed up fresh — account usable immediately, a
    real verification email arrived without any explicit trigger; clicked its link → "Email
    verified" page → DB confirmed `emailVerified` stamped and the token row consumed. Separately,
    triggered "Resend" on an existing unverified seed account from `/account/preferences`,
    followed that link, and watched the badge flip from "Not verified" to "Verified" on reload.
- **3.3** ✅ **Forgot password.** `/forgot-password` (email only) and `/reset-password?token=...`
  (new password) give a locked-out user a self-service path that doesn't depend on an admin being
  available. Shares `verification-tokens.ts` with 3.1/3.2 — a 1-hour expiry, tighter than email
  verification's 24 hours, since a password reset is more sensitive than an address-ownership
  check.
  - **Enumeration deliberately closed off:** `requestPasswordReset()` returns the identical
    `{ ok: true }` regardless of whether the email matches an `ACTIVE` account — no message that
    varies by outcome, unlike sign-up's "already in use" check. This is the one flow in the app
    worth that protection, since (unlike sign-up) it's the natural target for probing which
    addresses have accounts. Whether email is configured at all is still revealed up front — that's
    operational state, not account data, so it can fail loudly before the enumeration-safe check.
  - **Session handling mirrors the admin-initiated reset, not a signed-in password change:** every
    `DeviceSession` is revoked, with no "current session" exemption — the requester isn't
    authenticated yet, so there's nothing to exempt. A distinct audit code
    (`account.password.reset_completed`) keeps it separable from an admin's `user.password.reset`
    in the log.
  - **Verified end-to-end in Chrome + Mailpit:** requested a reset for a real account → real email
    arrived → followed its link → set a new password → landed auto-signed-in on `/dashboard`, with
    both "Requested a password reset" and "Reset password via emailed link" in the audit trail.
    Requesting a reset for a nonexistent email produced the byte-identical on-screen confirmation
    and, confirmed via Mailpit, sent no email at all. Re-submitting the same (now-consumed) link
    was correctly rejected as invalid/expired, matching invitations' and email-verification's
    single-use behavior.
- ✅ **3.4 — Honour deletion requests.** `deletionRequestedAt` is now enforced: `requireUser()`
  soft-deletes any account past the 30-day window on its next request (no scheduled job — there is
  no job runner in this app, so it piggybacks on the same chokepoint that already enforces
  revocation and suspension), reusing the soft-delete semantics of FR-44 via `softDeleteUser()` in
  `lib/auth/deletion.ts`. Requesting deletion now also requires a password confirmation and
  revokes every `DeviceSession`, including the current one, so the request takes effect
  immediately rather than leaving the session live for up to 30 days. Formerly D-8, now resolved.

**Exit criteria:** a user can be onboarded and can recover access without administrator
intervention — or the unreachable states have been removed from the schema.

---

## Phase 4 — Audit depth 🟡

**Why:** the audit log stores considerably more than it shows. `actionCode`, `targetUserId`,
`method`, `statusCode`, `ipAddress`, `userAgent` and `metadata` are all written and none are
filterable; the view offers only range and scope (D-9).

- **4.1** ✅ **Centralised the action codes.** `lib/audit.ts` now exports `ACTION_CODES` (22
  codes — grown from FR-85's original 18 as Phase 3 added invitation/reset lifecycle events) as a
  `const` tuple plus the derived `ActionCode` union, and `AuditInput.actionCode` is typed against
  it instead of `string`. Every existing call site's literal matched the vocabulary exactly
  (`pnpm typecheck` passed with zero changes needed elsewhere) — verified the guard is real, not
  just quiet, by deliberately typo-ing one call site (`"user.role.change"`) and confirming `tsc`
  rejected it with a "Did you mean" pointing at the correct code, then reverting.
- **4.2** ✅ **Filters for action code and target added.** `/account/audit-logs` gained an "All
  actions" `<select>` (options rendered directly from `ACTION_CODES`, humanized —
  `"user.role.changed"` → `"User role changed"` — so there's no separate label map to keep in
  sync) and a "Search target" free-text box matching `targetLabel` case-insensitively, mirroring
  `UserFilters`' existing search-box pattern (uncontrolled input keyed by the current value, so
  the URL — not React state — is the source of truth). Both compose with the existing range/scope
  filters and reset pagination on change; a "Clear filters" button appears only once one is
  active.
  - **Split `ACTION_CODES` out of `lib/audit.ts` into `lib/action-codes.ts`:** the filter select is
    a Client Component, and `lib/audit.ts` imports `next/headers` and the Prisma client — pulling
    that into the browser bundle broke the build (`pg`/`@prisma/adapter-pg` have no browser
    build). `lib/audit.ts` re-exports both `ACTION_CODES` and `ActionCode` from the new module, so
    every existing server-side import kept working unchanged.
  - **Verified live:** selecting an action filtered the table to only matching rows, with the URL
    reflecting `?actionCode=...`; searching a target's name matched case-insensitively; "Clear
    filters" reset both filters and returned to the full unfiltered log. Also caught, via the
    build, that a Client Component transitively importing Prisma is a real error, not just a
    lint nit — confirms the fix actually mattered rather than being defensive-only.
- **4.3** ✅ **IP, user agent and `metadata` surfaced in an expandable row detail.** Each row in
  `/account/audit-logs` is now a small client component (`AuditLogRow.tsx`) rather than a plain
  `<tr>` — needed for per-row expand/collapse state, which a server component can't hold. Clicking
  a row with at least one of the three present toggles a detail line below it (IP address, user
  agent, and pretty-printed `metadata` when set); a row with none of them shows no chevron and
  isn't clickable, which in practice only happens for a request-less write like the grace-period
  deletion sweep.
  - **`metadata` is genuinely never populated by any call site today** — despite the original
    "Why" framing above listing it alongside the other written-but-unsurfaced columns, `grep`
    turned up zero uses. The detail view still renders it whenever present, so a future call site
    that starts passing it needs no UI change — but there's nothing to see yet.
  - **Verified live:** expanded a row, confirmed the real IP (`::1`, this session's Mailpit-fronted
    localhost) and user agent (this session's actual Chrome/Mac string) rendered correctly;
    collapsed it back; expanded two different rows simultaneously to confirm state is per-row, not
    shared.
- **4.4** ✅ **CSV export for a filtered range.** "Export CSV" on `/account/audit-logs` mirrors the
  current filters (range/scope/actionCode/target, minus pagination) into
  `GET /account/audit-logs/export`, which returns an RFC 4180 CSV covering the whole filtered
  range in one file (capped at 5,000 newest rows) rather than just the loaded page.
  - **Refactored `lib/queries/audit.ts` rather than duplicating its where-clause:** extracted
    `buildAuditWhere()` and a shared `toView()` mapper, used by both the existing paginated
    `getAuditLogs()` and the new unpaginated `getAuditLogsForExport()` — same authorization
    (`requireUser()`) and scope-clamping logic in one place, not copy-pasted.
  - **Route placement was a real decision, not default:** the export route is `GET
    app/account/audit-logs/export/route.ts`, deliberately *not* under `app/api/` — that prefix is
    public (skips the proxy's session-redirect gate, per Phase 2's bearer-token routes), which is
    wrong for a route that needs the ordinary session-cookie protection every other page gets.
    Verified with `curl`: an unauthenticated request to the export URL gets the same 307 to
    `/signin` as any other protected page.
  - **New `lib/csv.ts`:** minimal RFC 4180 serialization (quote a field only when it contains a
    comma/quote/newline, double embedded quotes) — no library needed for nine columns.
  - **Verified live:** rather than trust a browser file download (Chrome's automation profile
    didn't surface it in `~/Downloads` — plausibly restricted in that context), exercised the
    authenticated route directly via `fetch()` from the page's own JS console: `200`, correct CSV
    header row, real DB rows, proper quoting on fields containing commas (formatted dates,
    user-agent strings), and exactly 20 lines (header + 19 rows) matching the UI's "Viewing 19
    logs in total".
- **4.5** ✅ **Considered — documented, deliberately not enforced.** Decision (asked explicitly,
  since unlike every other Phase 4 item this one is a policy call, not a build task):
  document a recommendation rather than build enforcement now. Recorded as `DR-05` in
  `docs/SRS.md` — retain `AuditLog` rows for 365 days from `createdAt`, then archive or
  hard-delete, a common security-log baseline that comfortably covers this app's own longest
  built-in look-back (`AuditRange`'s `30d`). Left unenforced because this app has **no
  scheduled-job infrastructure at all** — the only other time-based cleanup here (the 30-day
  deletion grace period, FR-61a) works by piggybacking on `requireUser()`, a chokepoint every
  authenticated request already passes through, and `AuditLog` rows have no equivalent per-row
  request trigger to piggyback on. Building a cron/job runner just for this one item would be
  disproportionate to the rest of this phase. Revisit once the app has scheduled-job
  infrastructure for any reason — at that point this becomes a straightforward
  `deleteMany({ where: { createdAt: { lt: cutoff } } })`.

**Exit criteria:** an administrator can answer "what did this user do, and from where" without a
database query.

---

## Phase 5 — Engineering hygiene 🟢

**Why:** low urgency, but each item raises the cost of every future change while it remains.

- **5.1** ✅ **Chose a test framework: Vitest.** `pnpm test` runs `vitest run`. No Vite/webpack
  plugin needed since the first suite has zero DOM/React surface — `vitest.config.mts` just aliases
  `@/*` to match `tsconfig.json`'s path mapping. `lib/permissions.test.ts` covers every escalation
  guard (FR-32 – FR-37): no self-action for any role, admin acts on anyone but themselves, a
  manager only acts on strictly lower ranks (not a peer manager, not upward on an admin), members
  and viewers can act on no one, and `assignableRolesFor`/`canAssignRole` block a manager from
  granting `MANAGER` or `ADMIN`. 15 tests, all passing; `pnpm typecheck` and `pnpm lint` unaffected.
  Config file uses `.mts` rather than `.ts` to avoid Vite's CJS/ESM ambiguity warning without
  setting `"type": "module"` in `package.json`, which could affect Next.js's own module handling.
- **5.2** ✅ **Added CI.** `.github/workflows/ci.yml` runs on every push and pull request:
  `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (5.1's Vitest suite —
  added here too since it now exists, cheap to run, and the roadmap's own ordering principle is
  "close gaps," not "match the plan verbatim"), then `pnpm build`. No Postgres service container is
  needed: `lib/env.ts` only validates that `DATABASE_URL`/`AUTH_SECRET`/`NEXT_PUBLIC_APP_NAME`/
  `NEXT_PUBLIC_APP_DOMAIN` are present and well-formed, and `next build` never opens a connection
  during page-data collection — verified locally by running `pnpm build` with dummy env values and
  no reachable database, which succeeded (21 routes generated, no Prisma connection error).
- **5.3** ✅ **Deleted `package-lock.json`.** `pnpm-lock.yaml` is now the only lockfile in the repo,
  so `npm install` can no longer silently create a second, divergent one (D-14, resolved).
- **5.4** ✅ **Documented `SHADOW_DATABASE_URL` in `.env.example`**, commented out alongside the
  `docker exec ... CREATE DATABASE portal_shadow` command that provisions it — matches the
  optional-until-needed pattern already used for `AUTH_URL` (D-13, resolved).
- **5.5** ✅ **Removed the dead `Authenticator` model.** Dropped the table, its FK constraint, and
  the `authenticators` relation off `User` in `prisma/schema.prisma`
  (`prisma/migrations/20260827013649_drop_authenticator/`) — no WebAuthn support exists anywhere
  else in the app, so the table implied a capability that didn't exist (D-11, resolved).
- **5.6** ✅ **Command palette search is now live data**, layered on top of the still-relevant
  hardcoded nav list rather than replacing it (⌘K should always be able to jump to
  `/account/security` even with an empty query — that part of the old behavior was correct, just
  incomplete). `searchPalette()` (`lib/actions/search.ts`) now runs both a user search
  (pre-existing `searchUsersForPalette()`) and a new `searchAuditLogsForPalette()`
  (`lib/queries/audit.ts`) in parallel and returns `{ users, auditLogs }`; `CommandPalette.tsx`
  renders nav + user hits + real audit-log hits together instead of the old single canned
  `Search audit logs for "<query>"` link that appeared unconditionally regardless of whether
  anything actually matched.
  - **Scope enforced server-side, matching the audit log page's own rule:** a non-manager only
    ever gets their own rows back from `searchAuditLogsForPalette()` (`actorId` filter), same as
    `getAuditLogs()`'s scope clamping — but unlike the page, the palette always searches everything
    the viewer is authorized to see (no "mine"-by-default), since a search box with no visible
    scope toggle shouldn't silently narrow results.
  - **Fixed a real bug during implementation, not just added the feature:** an early version used
    `requireUser()` (which redirects when signed out) for the audit search, which would have broken
    the palette for anonymous visitors — `CommandPalette` is mounted globally in `app/layout.tsx`,
    including on the public `/` landing page. Switched to `getCurrentUser()` (returns `null`
    instead of redirecting), matching the pattern `searchUsersForPalette()` already used.
  - **Verified live in Chrome against the dev DB:** signed in as an existing `MANAGER` account,
    searched "password" and got five real, distinctly-timestamped audit rows (`Reset password via
    emailed link`, `Set a password`, etc.) rather than a canned link; searched "dana" and got a
    real user hit (`Dana Lopez` / `dana@example.com`) whose click landed on `/users?q=dana%40example.com`
    pre-filtered to that one row; searched "invited" and got two real invitation rows whose
    sublabels showed the actual invitee names (`Riley`, `Casey Test`), and clicking one landed on
    `/account/audit-logs?target=Riley` correctly filtered to that target's 2 matching rows.
- **5.7** ✅ **Renamed the package.** `package.json`'s `name` is now `"portal"`, not
  `"my-template"`.
- **5.8** ✅ **Added rate limiting** to `auth.ts`'s Credentials `authorize()` — the one chokepoint
  that covers both password sign-in and the TOTP code check added in 1.2, since a correct code is
  only ever checked after a correct password on the same call.
  - **New `lib/auth/rate-limit.ts`:** a plain in-memory fixed-window counter, deliberately not
    backed by Redis or any external store — this app runs as a single long-lived Node server (see
    CLAUDE.md), not a fleet of serverless instances that would each keep independent counters, so
    a `Map` already gives every request the same view. Cached on `globalThis` across Next's dev-mode
    HMR passes, same reasoning as `lib/prisma.ts`'s connection-pool cache. Expired buckets are swept
    lazily on the next `recordFailure` call rather than by a background job — this app has no
    scheduled-job infrastructure at all (the same reasoning already applied to `AuditLog` retention
    in 4.5's DR-05) — capped to run at most once a minute so the sweep itself stays cheap.
  - **Two independent limiters, both keyed off failed attempts only** (never successes — a limiter
    that also counted successes would eventually lock out normal use): 10 failures per 15 minutes
    per **account** (email, lower-cased) covers a targeted attack on one account and is generous
    enough that a user mistyping a TOTP code twice doesn't get locked out; 30 failures per 15
    minutes per **IP** is deliberately looser (a shared office NAT can legitimately produce many
    sign-ins) and exists only to slow a credential-stuffing scan across many different accounts
    from one source. The account limiter is checked and enforced regardless of whether the email
    belongs to a real account, so probing many nonexistent addresses behaves identically to probing
    one real one — no enumeration signal added on top of what already existed.
  - **A wrong TOTP code only counts as a failure once a code was actually submitted** — the first
    pass of the two-step 2FA flow (password only, which throws `TwoFactorRequired` to reveal the
    code field) is not itself a guess and must not consume attempts.
  - **Checked before querying the database or running bcrypt**, so a locked-out account/IP doesn't
    get another round of expensive work — this also means the rate-limit check itself does not
    become a new timing oracle for account existence, since it runs identically either way.
  - **New `TooManySignInAttempts` error class** (mirrors `TwoFactorRequired`'s pattern, including
    the explicit static `.type` since it doesn't survive `extends` automatically) surfaces as "Too
    many sign-in attempts. Try again in a few minutes." in `signInAction` — a distinct message from
    the generic "Incorrect email or password.", but one that reveals nothing about whether the
    account exists, since it fires the same way for a made-up address.
  - **Unit-tested** (`lib/auth/rate-limit.test.ts`, 6 tests, using `vi.useFakeTimers()` to control
    window expiry deterministically): allows with no history, stays allowed under the limit, blocks
    at the limit, resets after the window elapses, `clearRateLimit` un-blocks immediately, and
    independent keys don't interfere with each other.
  - **Verified end-to-end in Chrome against the dev server:** submitted 10 wrong passwords for a
    real `MANAGER` account and got the generic "Incorrect email or password." each time, then hit
    "Too many sign-in attempts. Try again in a few minutes." exactly on the next attempt — including
    when that next attempt used a different password, confirming the lockout is enforced before
    credential verification, not just after N wrong guesses specifically. A fresh, nonexistent
    email in the same browser session (same IP, well under the per-IP limit) got the normal
    "Incorrect email or password." on its first attempt, confirming per-account buckets are
    isolated and the account limiter doesn't false-positive across different emails.
  - **Deliberately out of scope here:** `requestPasswordReset()` (forgot-password) is a separate
    enumeration-sensitive endpoint that could also benefit from rate limiting, but the roadmap item
    that motivated this work named sign-in and the TOTP check specifically — worth its own item
    rather than folded in silently.
- **5.9** ✅ **`User.twoFactorSecret` is encrypted at rest.** Already implemented in code
  (`lib/auth/totp.ts`'s `encryptTwoFactorSecret()`/`decryptTwoFactorSecret()`, wired into
  enrollment in `lib/actions/twoFactor.ts` and decrypted on sign-in in `auth.ts`) using the same
  AES-256-GCM-via-`AUTH_SECRET`-derived-key technique the pending-enrollment token already used,
  with a distinct key label (`"2fa-secret-at-rest"` vs. `"2fa-pending"`) so the two purposes don't
  share key material even though both derive from the same root secret. This item's remaining work
  was verifying it end-to-end and adding coverage, not building it:
  - **Unit-tested** (`lib/auth/totp.test.ts`, 5 tests): round-trips a secret through
    encrypt→decrypt, confirms the ciphertext never contains the plaintext secret as a substring,
    confirms two encryptions of the same secret produce different ciphertext (random IV per call),
    and confirms both a malformed ciphertext and a tampered (bit-flipped) one throw rather than
    silently returning wrong data — GCM's auth tag catches the latter.
  - **`vitest.config.mts` now loads `.env` via `setupFiles: ["dotenv/config"]`**, since
    `lib/auth/totp.ts` transitively imports `lib/env.ts`, which throws at import time if
    `AUTH_SECRET` etc. aren't set — the same file `prisma.config.ts` already reads via `dotenv`, so
    this doesn't introduce new config. A harmless no-op in CI, where those variables are already
    set as job-level env vars (`dotenv` doesn't override variables that already exist).
  - **Verified end-to-end in Chrome against the dev DB, not just unit-tested in isolation:**
    enrolled a real account in 2FA through the actual UI, confirmed via `psql` that
    `User.twoFactorSecret` holds base64url ciphertext (`iv.authTag.data`) rather than the
    plaintext secret shown in the enrollment QR/manual-key step; signed out and back in with the
    real password and a TOTP code computed from that same plaintext secret, confirming the
    decrypt-on-sign-in path genuinely round-trips through Postgres and not just through the
    encrypt/decrypt functions in memory; disabled 2FA afterward and confirmed the column was
    cleared, restoring the test account to its original state.
  - **Known gap, documented rather than silently accepted:** this only protects secrets enrolled
    under the current `AUTH_SECRET`. There is no rotation path — rotating `AUTH_SECRET` would make
    every already-encrypted `twoFactorSecret` undecryptable (`decryptStoredSecret()` in `auth.ts`
    already fails closed in that case, forcing `TwoFactorRequired` forever rather than crashing or
    silently skipping the check, but that still permanently locks out anyone enrolled). No
    encryption-key-rotation story exists anywhere in this app yet; out of scope here.
- **5.10** ✅ **Fixed the access-token dialog's stuck-closed state**, found during 2.5's
  verification. `AccessTokensTable.tsx` now tracks the specific plaintext already
  shown-and-dismissed (`dismissedToken`, a string, not a boolean) instead of checking
  `!state.plaintext` — `showReveal = Boolean(state.plaintext) && state.plaintext !== dismissedToken`,
  `showDialog = dialogOpen && !showReveal`. The old check could never go back to `true` on its own
  because `useActionState`'s `state.plaintext` only updates on the next dispatch, and the dialog
  wouldn't show to let that dispatch happen — comparing by value instead of by "has any reveal ever
  happened" is what lets a *second* Generate flow open the dialog and show its own reveal panel.
  This was already implemented and committed (bundled into `200fa3a`, alongside the `Authenticator`
  removal) by the time this item came up for its own verification pass here — nothing left to build.
  - **Verified live in Chrome against the dev server, in one continuous session (no reload):**
    generated `test-token-1`, dismissed its reveal panel via the × button, clicked "Generate new
    token" again and confirmed the dialog actually reopened (the exact failure this item names —
    previously stuck closed for the rest of the session), generated `test-token-2`, and confirmed
    it got its own distinct reveal panel with its own token value rather than reusing or hiding
    behind the first. Revoked both test tokens afterward to leave the account's token list empty,
    matching its state before this verification.
  rather than deriving visibility from stale action state.

---

## Phase 6 — A first admin panel 🟢

**Why:** there is currently no admin/site-wide settings page anywhere in the app — only the
`/users` table and each user's own `/account/*` pages. A couple of requested features need one,
so it's worth building the first version deliberately rather than as a side effect of whichever
feature asks for it first.

- **6.1** ✅ **Logo upload.** `components/dashboard/AppLogo.tsx` now accepts an optional `src` and
  renders it via a plain `<img>` (same `next/image`-skipping tradeoff `TwoFactorSettings.tsx`
  already made for its QR code — the file lives outside the build with no known dimensions to
  configure ahead of time), falling back to the original inline SVG when `src` is null. Actually
  5 call sites needed updating, not the 4 originally listed above — `app/terms/page.tsx` was
  missed in the original scoping.
  - **New `AppSettings` singleton model** (`prisma/migrations/20260827001256_add_app_settings/`):
    `id` fixed at `"singleton"`, `logoUrl String?`. The first app-wide config table in the schema —
    a real second setting should be a new column here, not a new table. Read via
    `lib/queries/settings.ts`'s `getAppSettings()`, a public unauthenticated read (the landing page
    and sign-in layout have no session) cached the same way `getCurrentUser()` is.
  - **Storage decision: `public/uploads/`, not a hosted object-storage provider.** No such package
    (`@vercel/blob`, an S3 client, …) existed in `package.json` at all, and this app already assumes
    a long-lived Node server (CLAUDE.md) — the same assumption `/docs` makes reading a file off disk
    at request time. Next's built-in static file serving reads `public/` from disk per-request
    rather than baking a build-time manifest, so a file written after boot is served immediately,
    no restart needed. Explicitly documented as NOT portable to a serverless target (no durable
    local disk, possibly multiple instances with no shared filesystem) — revisit if that changes.
    `lib/logo-storage.ts` handles validation (≤2MB, PNG/JPEG/WebP only) and the actual
    write/delete; `image/svg+xml` is deliberately excluded — an SVG served from this app's own
    origin executes embedded script if a browser is ever pointed at the file directly (`<object>`,
    `<iframe>`, or plain navigation), unlike an `<img src>` reference. Excluding the format removes
    that stored-XSS surface entirely rather than trying to sanitize SVG markup.
  - **New `ADMIN`-only route, `/admin`**, gated by a new `requireAdmin()` in `require-session.ts`
    (stricter than `requireUserManager()` — a manager can act on lower-ranked users but has no
    business changing app-wide settings; redirects to `/dashboard`, not `/account/preferences`,
    since a manager landing here already belongs on the dashboard). Composed from `Header` +
    `IconSidebar` like `/users`, plus a new "Admin" nav item in `IconSidebar` — threaded through a
    `showAdmin` prop from `/dashboard`, `/users`, and `/admin` itself, rather than having the
    sidebar re-derive the role, since it already takes no other data-fetching responsibility.
  - **`lib/actions/settings.ts`'s `updateLogo()`/`removeLogo()`** follow the established Server
    Action shape (`requireAdmin()` → mutate → `logAudit()` → `revalidatePath`), logging two new
    action codes (`settings.logo.updated`, `settings.logo.removed`) added to `lib/action-codes.ts`.
    Revalidation is deliberately `revalidatePath("/", "layout")`, not a per-page list — the logo
    appears in headers and layouts across nearly every route, so a global asset gets a global
    invalidation rather than an easily-incomplete list of specific paths.
  - **`components/admin/LogoSettings.tsx`** (client leaf, server shell in `app/admin/page.tsx`)
    shows an immediate local preview via `URL.createObjectURL()` before the upload round-trips,
    then hands off to the server-refreshed `currentLogoUrl` once it actually succeeds — done by
    adjusting state during render (comparing `state` against a `prevState` local) rather than a
    `useEffect`, since a plain effect calling `setPreview()` synchronously trips this repo's
    `react-hooks/set-state-in-effect` lint rule; the file input is reset by bumping a `key` (the
    standard way to clear an uncontrolled file input) instead of an effect reaching into the DOM.
  - **A real, unplanned build-time regression, found and fixed, not just described:** `app/page.tsx`,
    `app/terms/page.tsx`, and `app/(auth)/layout.tsx` were previously synchronous components with no
    database access, so `pnpm build`'s static prerendering never touched Prisma for them — this is
    exactly why 5.2's CI could get away with a fake, unreachable `DATABASE_URL`. Making them `async`
    to read `getAppSettings()` means Next now genuinely queries the database while statically
    prerendering those routes at build time, and the fake CI credentials started failing the build
    outright. Fixed by giving CI's job a real (if empty) `postgres:17` service container and running
    `prisma migrate deploy` before `pnpm build`, rather than reverting to a dynamic-rendering
    workaround — a real deployment already has a reachable database at build time, so this makes CI
    match reality instead of papering over it. Confirmed locally: `pnpm build` against a live,
    freshly-migrated dev database succeeds and correctly statically prerenders `/` and `/terms`
    (both still show as `○` in the build output).
  - **Verified end-to-end in Chrome against the dev DB:** uploaded a real PNG through `/admin` as an
    `ADMIN` account — confirmed via `psql`/`ls` that the file landed on disk and `AppSettings.logoUrl`
    was set, confirmed the uploaded file is served correctly at its `/uploads/<id>.png` URL, and
    confirmed the new logo rendered immediately (no manual refresh) in the header **and** on the
    fully unauthenticated `/` landing page and `/signin` page, proving `revalidatePath("/", "layout")`
    actually invalidated every route. Clicked "Remove," confirmed the file was deleted from disk,
    `logoUrl` was cleared in the DB, and every page fell back to the default SVG. Confirmed a signed-in
    `MANAGER` account sees no "Admin" sidebar item and, on directly navigating to `/admin`, is
    server-side redirected to `/dashboard` rather than shown the page — not just hidden in the UI.
- **6.2 — A real view for submitted feedback.** `Feedback` (added alongside 6.1's motivating
  request) has no admin-facing read UI yet — rows are only inspectable via `psql`/Prisma Studio.
  Once 6.1's admin route exists, add a simple list view here rather than building a second,
  separate admin surface for it.
- **6.3 — Admin-authored announcements.** The old `NoticeBanner` (deleted in 1.7) was really this
  feature attempted without the infrastructure it needs: an `ADMIN`-authored message shown to
  users until they dismiss it, not a hardcoded client component. Needs a Prisma model (message,
  active flag, created/updated timestamps — a `Dismissal` join table or a
  `dismissedAnnouncementIds` column on `User` so "dismissed" actually persists instead of
  resetting on every navigation like the old banner did), a create/edit/deactivate Server Action
  reachable from the same admin route as 6.1/6.2, and a read-side query gating which page shells
  render it. Build after 6.1 exists rather than standing up a separate admin surface for it.

---

## Deliberately out of scope

Recorded so the question is settled rather than re-litigated. See SRS §1.2.

- **Multi-tenancy** — organizations, projects, memberships, custom domains. Removed on purpose in
  `20260826090000_users_only`. Do not reintroduce.
- **Billing, plans, quotas, metering.**
- **Federated identity beyond Google** — no SAML, no LDAP, no WebAuthn.
- **A public API.** Phase 2 adds machine endpoints for token holders, not a general API surface.
