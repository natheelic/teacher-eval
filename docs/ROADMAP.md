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
- **2.3** Write `ApiToken.lastUsedAt` on each successful authentication, so the token list shows
  which tokens are live.
- **2.4** Honour `expiresAt` — and expose an expiry field in the creation form, which currently
  offers only a name.
- **2.5** Define and enforce `scopes`. The column is `String[]` with a default of `[]` and is
  never written; decide the vocabulary before it accumulates ad-hoc values.
- **2.6** Adopt `tokenPreview()` in `lib/auth/tokens.ts` — it has zero callers because the preview
  string is re-inlined in `lib/queries/account.ts`. One of the two should go.

**Exit criteria:** a token minted in the UI can authenticate a request, and its `lastUsedAt`
updates.

---

## Phase 3 — Account lifecycle 🟡

**Why:** three schema features describe a lifecycle the code does not implement. Each requires
email transport, which the system does not have — so **the first decision in this phase is
whether to add a mail dependency at all.** If the answer is no, the corresponding schema should be
simplified rather than left as a promise.

- **3.1 — Invitations.** `UserStatus.INVITED` is a filter option that no code path can produce;
  `createUser` hardcodes `ACTIVE` and sets a password directly, though it does record
  `invitedById` (D-7). Implement invite-by-email with a one-time acceptance link, or remove
  `INVITED` from the enum and the filter.
- **3.2 — Email verification.** `User.emailVerified` is never written and the `VerificationToken`
  model is dead (D-11). Either activate it or drop the model.
- **3.3 — Forgot password.** There is no reset route. Administrators can reset another user's
  password, but a locked-out user with no admin available has no recourse. This shares the
  `VerificationToken` machinery with 3.2.
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

- **4.1** **Centralise the action codes.** The 18 codes in FR-85 are inline string literals at
  every call site with no shared constant, so a typo produces a silently unfilterable row. Extract
  them to a single `const`/union in `lib/audit.ts` and type `AuditInput.actionCode` against it.
  *Do this before 4.2* — filtering by action code is only safe once the vocabulary is closed.
- **4.2** Add filters for action code and target user.
- **4.3** Surface IP, user agent and `metadata` in an expandable row detail.
- **4.4** Add CSV export for a filtered range.
- **4.5** Consider a retention policy. `AuditLog` grows without bound and has no archival path.

**Exit criteria:** an administrator can answer "what did this user do, and from where" without a
database query.

---

## Phase 5 — Engineering hygiene 🟢

**Why:** low urgency, but each item raises the cost of every future change while it remains.

- **5.1** **Choose a test framework.** None is configured (D-12, NFR-25). Start with
  `lib/permissions.ts` — it is pure, has no Prisma or request context, and encodes the rules
  where a regression is most dangerous. The escalation guards (FR-32 – FR-37) are the highest-value
  tests in the codebase and are trivially unit-testable.
- **5.2** **Add CI** running `pnpm lint`, `pnpm typecheck` and `pnpm build` on every push.
- **5.3** **Delete `package-lock.json`.** It coexists with the authoritative `pnpm-lock.yaml` and
  invites a wrong-package-manager install (D-14).
- **5.4** **Document `SHADOW_DATABASE_URL` in `.env.example`.** It is read by `prisma.config.ts`
  and required for the documented destructive-migration workflow, but appears nowhere in the
  example environment (D-13).
- **5.5** **Remove the dead `Authenticator` model** unless WebAuthn is genuinely planned (D-11).
  An unused table implies a capability that does not exist.
- **5.6** **Make the command palette search live data** — it currently searches a hardcoded
  five-item navigation list in `components/search/search-data.ts` and cannot find a user or a log
  entry (NFR-42).
- **5.7** **Rename the package.** `package.json` still reads `"name": "my-template"`.
- **5.8** **Add rate limiting.** No rate-limiting infrastructure exists anywhere in the app,
  including on password sign-in and the new TOTP code check added in 1.2 — needed before this app
  is exposed beyond a trusted network.
- **5.9** **Encrypt `User.twoFactorSecret` at rest.** It is currently stored in plaintext, same as
  the column the schema already reserved for it. It must stay decryptable (unlike a password
  hash), so encrypting the column with a key derived from `AUTH_SECRET` — the same technique
  `lib/auth/totp.ts` already uses for the short-lived pending-enrollment token — is a reasonable
  follow-up hardening step.

---

## Phase 6 — A first admin panel 🟢

**Why:** there is currently no admin/site-wide settings page anywhere in the app — only the
`/users` table and each user's own `/account/*` pages. A couple of requested features need one,
so it's worth building the first version deliberately rather than as a side effect of whichever
feature asks for it first.

- **6.1 — Logo upload.** No logo/branding config exists today: `components/dashboard/AppLogo.tsx`
  is a hardcoded inline SVG used identically at all 4 call sites (`app/page.tsx`,
  `app/(auth)/layout.tsx`, `components/dashboard/Header.tsx`, `components/account/AccountHeader.tsx`),
  and `lib/app-config.ts` only exposes `appName`/`appDomain` from build-time env vars — nothing
  DB-backed or user-uploadable. Building this needs: a new `ADMIN`-only route (the actual start of
  this phase), a storage decision (no upload/object-storage package exists in `package.json` at
  all — e.g. `@vercel/blob`, S3-compatible bucket, or a `public/`-write fallback), a new Prisma
  field for the logo URL (a singleton settings row, since there's no existing app-wide config
  table), a new upload Server Action, and updating `AppLogo.tsx`'s 4 call sites to render it
  conditionally instead of the hardcoded SVG.
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
