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
| 1.1 | **Write `lastLoginAt`** on successful authentication | The users table renders this column, so administrators currently see an empty value for every account and cannot tell an abandoned account from an active one (D-2). One write in the `signIn` event or the Credentials `authorize`. | `auth.ts` |
| 1.2 | **Resolve two-factor authentication** — either implement TOTP end to end (write `twoFactorSecret`, add enrolment with a QR code, add a challenge step to sign-in) or remove the toggle | A security control that reports "enabled" while doing nothing is worse than an absent one; a user may rely on it (D-1, FR-62). If TOTP is not near-term, hide the row. | `lib/actions/security.ts`, `components/account/SecuritySettings.tsx`, `auth.ts` |
| 1.3 | **Make `sidebarBehavior` do something** — have `IconSidebar` and `SettingsSidebar` read the preference | The setting offers three options and changes nothing (D-3, FR-71). | `components/dashboard/IconSidebar.tsx`, `components/account/SettingsSidebar.tsx` |
| 1.4 | **Decide the fate of `telemetryEnabled`, `editEntitiesInCode`, `queueTableOperations`** — wire them or drop them | Three more inert switches (D-4). Dropping them is a legitimate outcome and costs less than implementing them. | `components/account/{AnalyticsMarketing,DashboardSettings}.tsx`, `lib/actions/preferences.ts` |
| 1.5 | **Prune and implement keyboard shortcuts** | The list is hardcoded, several entries name features deleted with the tenancy layer ("New project", "Publish OAuth app", "Add project connection"), and only ⌘K exists (D-5). Delete the stale entries first, then implement what remains. | `components/account/KeyboardShortcuts.tsx` |
| 1.6 | **Fix stale copy on `/signup`** — it still promises the account "creates your organization and a first project" | Directly contradicts what the product does (D-10). | `app/(auth)/signup/page.tsx` |
| 1.7 | **Replace or remove the hardcoded `NoticeBanner`** | It shows fixed marketing copy about a Terms of Service update, with a "Learn more" button that goes nowhere, on every page (D-15). Either make it data-driven or delete it. | `components/dashboard/NoticeBanner.tsx` |
| 1.8 | **Remove or wire the dead chrome** — Feedback, Docs and Notifications buttons in the headers; the decorative sidebar collapse control; the unconditionally-active "Users" nav item | Non-functional affordances (D-15). | `components/dashboard/{Header,IconSidebar}.tsx`, `components/account/AccountHeader.tsx` |

**Exit criteria:** no control in the interface persists state that nothing reads, and no copy
describes a capability the system lacks.

---

## Phase 2 — Make API tokens real 🟠

**Why:** tokens are fully implemented on the issuing side — hashing, preview, revocation, audit —
and completely unimplemented on the consuming side. Nothing authenticates with them, so the
feature currently produces secrets that do nothing (D-6).

- **2.1** Add a bearer-token authentication path: hash the presented token, look it up by
  `tokenHash`, reject revoked and expired tokens. Reuse `hashToken()` in `lib/auth/tokens.ts`.
- **2.2** Add at least one machine API route that this path protects, under `app/api/`. Route
  handlers are the correct mechanism here — they are explicitly reserved for machine APIs.
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
- **3.4 — Honour deletion requests.** `deletionRequestedAt` is set and cancellable, but nothing
  acts on it, so the implied grace-period promise is never kept (D-8). Add a scheduled job that
  soft-deletes accounts past the window — reusing the soft-delete semantics of FR-44 rather than
  inventing a second deletion path.

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

---

## Deliberately out of scope

Recorded so the question is settled rather than re-litigated. See SRS §1.2.

- **Multi-tenancy** — organizations, projects, memberships, custom domains. Removed on purpose in
  `20260826090000_users_only`. Do not reintroduce.
- **Billing, plans, quotas, metering.**
- **Federated identity beyond Google** — no SAML, no LDAP, no WebAuthn.
- **A public API.** Phase 2 adds machine endpoints for token holders, not a general API surface.
