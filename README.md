# ระบบประเมินผลการปฏิบัติงานครู — Teacher Performance Evaluation System

A web application for **วิทยาลัยการอาชีพลอง** (Long Industrial and Community Education College).
HR staff and evaluation committees use it to evaluate teachers accurately, transparently and quickly:
HR registers teachers and committee members, opens an evaluation round with a configurable rubric,
and assigns committees. Committee members score their assigned teachers on any device. HR reviews
and finalizes the results, and teachers view their own results and printable A4 reports.

Built on Next.js 16 (App Router), React 19, Prisma 7 and Auth.js v5, against Supabase PostgreSQL.

> **Status:** under active construction. The codebase began as a generic user-management app
> ("Portal"). Its authentication, session, audit and settings infrastructure is being reused, and
> the evaluation modules are being added phase by phase. [`docs/ROADMAP.md`](docs/ROADMAP.md) shows
> what has landed. [`docs/SRS.md`](docs/SRS.md) marks every not-yet-built requirement
> **[PLANNED]**.

---

## Features (target)

**Roles**: `ADMIN` (HR), `COMMITTEE`, `TEACHER`. Access is enforced on the server and scoped to
records: a committee member sees only their assigned teachers, and a teacher sees only their own
finalized results.

- **Records**: departments, teachers (photo, position, วิทยฐานะ, employment type), committee
  members and committee groups (ประธาน / กรรมการ / เลขานุการ).
- **Evaluation rounds**: a lifecycle of Draft → Open → In progress → Closed → Finalized. Each round
  has its own rubric (categories, criteria, min/max, weights, comment rules) and its own result
  bands, frozen when the round opens.
- **Assignments**: one or more committee members per teacher, or a whole committee group at once.
- **Evaluation form**: fast, touch-friendly scoring with live category totals, percentage and
  result band. Out-of-range scores are rejected, drafts can be saved, missing items are
  highlighted, submission is confirmed, and the form locks after submission.
- **HR review**: progress monitoring, approve / return for correction / cancel, and aggregation
  (average or weighted average) across committee members. Results are finalized as a frozen
  snapshot, and every decision is kept in history.
- **Results and reports**: a teacher result page, A4 print reports with signature blocks
  (print-to-PDF), and CSV and Excel exports.
- **Dashboards**: summary cards, charts, department summary and recent activity.
- **Search and notifications**: role-scoped global search and in-app notifications.
- **Platform**: device sessions, password reset, optional Google sign-in and TOTP, audit log, and
  configurable college identity, logo and SMTP.

There is **no public sign-up**. The first admin is created from the command line, and HR creates
every other account.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3.2 (App Router, Turbopack) |
| UI | React 19.2.8, Tailwind CSS v4, `lucide-react`, Noto Sans Thai |
| Auth | Auth.js v5 (`next-auth@5.0.0-beta.32`) + `@auth/prisma-adapter` |
| Database | Supabase PostgreSQL (schema `portal`), Prisma 7.9.1 + `@prisma/adapter-pg` |
| Validation | zod 4 |
| Tests | Vitest |
| Package manager | pnpm 11 (run as `npx pnpm@10 …` if pnpm isn't installed globally) |

---

## Quick start (Supabase)

```bash
pnpm install
cp .env.example .env          # then fill it in — see below
npx auth secret               # paste into AUTH_SECRET
pnpm exec prisma migrate deploy
pnpm exec tsx scripts/create-admin.mts '<a strong password>'   # creates admin@local.dev
pnpm dev                       # or: pnpm build && pnpm start
```

Open <http://localhost:3000> and sign in as `admin@local.dev`.

### Supabase connection strings

Put your project's connection strings in `.env` and append **`&uselibpqcompat=true&schema=portal`**
to each `POSTGRES_*` URL:

- `POSTGRES_PRISMA_URL`: the transaction pooler (port 6543, `pgbouncer=true`), used by the app at
  runtime.
- `POSTGRES_URL_NON_POOLING`: the session pooler (port 5432), used by Prisma CLI commands.

`schema=portal` keeps every application table in its own Postgres schema. **The `public` schema of
the shared database holds another application's tables, which this app must never touch.**
`uselibpqcompat=true` gives `sslmode=require` its libpq meaning (encrypted, no CA check). Without
it, node-postgres rejects Supabase's pooler certificate chain with "self-signed certificate in
certificate chain".

`pnpm start` (production mode) also needs `AUTH_URL`, e.g. `http://localhost:3000`. Otherwise
Auth.js rejects every request with `UntrustedHost`.

### Demo data (development only)

```bash
pnpm exec tsx scripts/seed-demo.mts --yes     # [planned]
```

This creates seven departments, sample teachers, committee members and groups, and round 2569/1
with the template rubric and mixed statuses, plus one demo account per role. It is idempotent and
refuses to run with `NODE_ENV=production`.

### Local Postgres instead of Supabase

`pnpm db:up` starts Postgres, pgAdmin and Mailpit in Docker (`docker-compose.yml`). Set
`DATABASE_URL` to the local instance and run `pnpm exec prisma migrate deploy`.

### Optional: email

Invitations, verification and password reset need SMTP. Configure it at **ตั้งค่าระบบ › อีเมล**
or with `SMTP_HOST`/`SMTP_PORT`/`SMTP_FROM`. Without email, HR sets each new user's initial
password instead of sending an invitation. Locally, Mailpit catches all mail at
<http://localhost:8025>.

### Optional: Google sign-in

Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, and register
`<origin>/api/auth/callback/google` as a redirect URI. Google can sign in only to accounts that HR
has already created.

---

## Environment variables

`lib/env.ts` validates these at import time and throws on anything missing or malformed.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | One DB URL | Overrides the `POSTGRES_*` URLs |
| `POSTGRES_PRISMA_URL` | One DB URL | Pooled runtime connection |
| `POSTGRES_URL_NON_POOLING` | One DB URL | Direct/session connection for Prisma CLI |
| `POSTGRES_URL` | One DB URL | Runtime fallback |
| `AUTH_SECRET` | ✅ | `npx auth secret` |
| `AUTH_URL` | Production | Canonical origin; required for `pnpm start` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | — | Both or neither |
| `SMTP_*` | — | Bootstrap email config |
| `NEXT_PUBLIC_APP_NAME` | ✅ | Fallback display name; TOTP issuer |
| `NEXT_PUBLIC_APP_DOMAIN` | ✅ | Bare hostname |
| `SHADOW_DATABASE_URL` | — | Only for `prisma migrate diff --from-migrations` |

---

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / run it |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | ESLint / `tsc --noEmit` / Vitest |
| `pnpm exec prisma migrate deploy` | Apply checked-in migrations |
| `pnpm exec tsx scripts/create-admin.mts <password>` | Create the first `ADMIN` (`admin@local.dev`) |
| `pnpm db:up` / `pnpm db:down` | Local Docker Postgres + pgAdmin + Mailpit |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | Reports counts only; creates nothing |

**Schema changes** that are destructive should be generated without a shadow database by diffing
schema files: `prisma migrate diff --from-schema <previous schema> --to-schema
prisma/schema.prisma --script`. Check the statement order, save the SQL as a new migration, then
run `prisma migrate deploy`.

---

## Project layout (target)

```
app/
  (auth)/          Sign-in, password reset, invitation acceptance (bare layout)
  dashboard/       Role-specific home
  teachers/ committee/ rounds/ assignments/      HR administration
  evaluate/        Committee evaluation form
  monitoring/      HR progress, review and finalization
  results/ reports/                              Results, A4 print pages, exports
  notifications/ settings/ account/
lib/
  scoring/         Pure scoring, validation, aggregation and bands (unit-tested)
  permissions.ts   Pure role/record permission rules (unit-tested)
  auth/require-session.ts   requireUser / requireAdmin / requireCommittee / requireTeacher
  queries/ actions/         Scoped reads / "use server" mutations
prisma/schema.prisma, prisma/migrations/
scripts/create-admin.mts, scripts/seed-demo.mts
```

---

## Documentation

| Document | Covers |
|---|---|
| [`docs/PLAN.md`](docs/PLAN.md) | Original product brief |
| [`docs/SRS.md`](docs/SRS.md) | Requirements specification (IEEE-830), with status markers and traceability |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phased delivery plan and current status |
| [`AGENTS.md`](AGENTS.md) | Architecture guide for coding agents |
