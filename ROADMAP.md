# Teacher Performance Evaluation System — Roadmap

Implementation roadmap for the system described in [PLAN.md](./PLAN.md), for
วิทยาลัยการอาชีพลอง (Long Industrial and Community Education College). The goal is a real,
role-secured application for managing evaluation rounds, assignments, scoring, review, and reports —
not a static mockup.

## Current state

The repository currently contains a user-management application, not the teacher-evaluation system.
There are no teacher, department, committee-assignment, evaluation, scoring, or result modules to
count as shipped. The existing Next.js, Auth.js, Prisma, PostgreSQL, audit, and settings
infrastructure may be reusable, but its current user roles and administrative workflows do not
implement this project. Treat evaluation functionality below as **not started** until it exists and
meets its exit criteria.

`PLAN.md` is the product brief. Before implementing official scoring, HR must confirm the current
approved evaluation form, score limits and weights, result bands, averaging policy, required
comments, and who may see feedback. The example criteria and result bands in the plan are not
official policy and must remain configurable.

## Delivery principles

- Build a functional end-to-end workflow before adding secondary dashboard polish.
- Keep UI, authorization, scoring, persistence, notifications, and report generation in separate,
  testable layers.
- Enforce permissions on the server for every page, query, action, and export; hiding a control is
  not authorization.
- Derive totals and status from persisted, validated records. Never trust client-submitted totals or
  a teacher/committee identifier without checking the signed-in user's assignment.
- Preserve a history of submitted, reopened, reviewed, and finalized work. Do not silently overwrite
  submitted evaluations or published criteria.
- Keep sample data confined to development/demo use; do not seed real-looking accounts or scores
  into production.
- Use readable Thai typography, responsive layouts, accessible controls, and print-specific A4
  styles throughout.
- Close each phase against its exit criteria before treating it as complete.

## Phases

### Phase 0 — Confirm policy and prepare the foundation

**Outcome:** agreed business rules and a safe base for the new application.

- Confirm the official evaluation form and the meaning, minimum, maximum, and weighting of each
  criterion.
- Decide how committee scores combine (initial recommendation: arithmetic average of submitted,
  valid evaluations, unless HR policy requires a different method).
- Confirm review and finalization authority, reopening rules, comment visibility, result access, and
  any appeal or correction process.
- Confirm the Buddhist/academic year convention, round dates, and required Thai report wording.
- Inventory existing authentication, role, audit, email, database, and deployment behavior before
  reusing it. Plan any role/schema migration; do not map existing roles to evaluation roles by
  assumption.
- Establish a test baseline and document environment setup and database migration practices.

**Exit criteria:** HR-approved rules are recorded; role and data migration risks are understood; the
development environment and test commands are reproducible.

### Phase 1 — Application identity, access, and navigation

**Outcome:** users can sign in to a coherent Thai evaluation application and see only the areas
their role may access.

- Replace the Portal/user-management product identity with the college and system identity from
  `PLAN.md`; implement the navy/blue, white, and restrained gold visual system and Thai font choice.
- Define and enforce the project roles: `ADMIN`/HR, `COMMITTEE`, and `TEACHER`. Add explicit
  permissions for committee assignment, evaluation, review, reopening, finalization, and result
  viewing.
- Provide sign-in, sign-out, protected routes, session handling, and safe unauthorized responses.
  Decide whether account creation is invitation-only; do not expose public registration by default
  for a staff-only evaluation system.
- Add responsive role-aware navigation and page shells. Provide useful empty/loading/error states.
- Add development-only demo accounts and data setup instructions once the access model exists.

**Exit criteria:** each role can authenticate in a test environment; server-side authorization tests
prove cross-role and cross-record access is denied; the app shell works on phone, tablet, and
desktop.

### Phase 2 — Core records and administration

**Outcome:** HR can maintain the records needed to open an evaluation round.

- Add departments and teacher profiles, including staff ID, name/prefix, position, academic rank,
  department, contact details, employment type, active status, and optional profile image.
- Add committee-member profiles and committee groups, including member role (chair, member,
  secretary), contact details, and active status.
- Add evaluation rounds with academic year, round number, title, date range, description, and
  controlled lifecycle (`DRAFT`, `OPEN`, `IN_PROGRESS`, `CLOSED`, `FINALIZED`).
- Add searchable, filterable HR management screens for teachers, departments, committee members,
  and rounds. Prefer deactivation or archival over destructive deletion when records are in use.
- Add audited create/update/deactivate operations and validation for unique identifiers and
  required fields.

**Exit criteria:** HR can create, update, search, filter, and deactivate records; referential
integrity and duplicate constraints are enforced in the database and application; changes are
audited.

### Phase 3 — Configurable criteria and assignments

**Outcome:** HR can configure a round and assign the right committee members to each teacher.

- Model evaluation categories and criteria with descriptions, instructions, min/max scores,
  weights, required-comment rules, and display order.
- Let HR configure criteria and result bands without code changes. Validate that score ranges and
  weights are internally consistent.
- Snapshot the criteria and scoring configuration when a round opens so later edits cannot silently
  change an evaluation already in progress. Define an explicit correction/versioning process.
- Assign one or more committee members to each teacher within a round. Prevent duplicate,
  inactive, or out-of-round assignments and make assignment status visible to HR.
- Provide assignment search, filters, and clear create/change/remove actions with audit history.

**Exit criteria:** an open round has a validated, versioned rubric; only its assigned active
committee members can evaluate a teacher; HR can review assignments and their status.

### Phase 4 — Committee scoring workflow

**Outcome:** committee members can complete accurate evaluations quickly, including on mobile.

- Build the primary evaluation screen with the teacher, round, committee, and rubric context always
  visible.
- Accept criterion scores only within the configured range. Calculate category totals, total
  possible score, aggregate score, percentage, and result band in shared server-side scoring logic.
- Support comments/evidence where policy requires them; clearly distinguish optional from required
  comments.
- Save drafts and resume later. Show incomplete criteria and validation errors before submission.
- Require a confirmation before submission. A successful submission becomes read-only to the
  committee member; only an authorized HR reopen action can permit edits, and that action is
  audited.
- Handle repeated submissions and simultaneous edits safely; prevent duplicate evaluations for the
  same assignment unless policy explicitly allows revisions.
- Test scoring boundaries, weighting/averaging, rounding, missing values, draft persistence,
  submission locking, and assignment authorization.

**Exit criteria:** a committee member can open an assigned teacher, enter scores, save a draft,
review missing fields, submit once, and see confirmation; invalid or out-of-range scores cannot be
persisted; unauthorized and post-submit edits are rejected server-side.

### Phase 5 — HR monitoring, review, and finalization

**Outcome:** HR can see progress and complete the approval workflow.

- Build the HR dashboard with counts for evaluated teachers, committee members, active round,
  completed, in-progress, not-started, and awaiting-review work.
- Provide evaluation monitoring by teacher, department, committee, progress, score, and status.
- Add department summaries, recent activity, and readable completion/status charts based on actual
  persisted data.
- Add review queues and detail views showing submitted scores, comments, rubric version, and
  committee completion.
- Let authorized HR approve/finalize, reopen, or return evaluations for correction according to
  the confirmed policy. Record actor, time, and reason for each decision.
- Compute multi-member results only from eligible submissions under the configured aggregation
  rule; expose submitted and outstanding committee counts.

**Exit criteria:** dashboard figures reconcile with underlying records; HR can identify incomplete
work, review submissions, apply permitted decisions, and finalize results with an audit trail.

### Phase 6 — Teacher results and formal reports

**Outcome:** finalized results are viewable by the right people and can be printed or exported.

- Add a teacher-only result view for the signed-in teacher. Show only that teacher's finalized
  results unless HR policy explicitly permits draft visibility.
- Show total score, maximum, percentage, configurable result band, category breakdown, and
  authorized committee feedback.
- Create print-specific A4 reports with college/system identity, evaluation round, teacher
  details, rubric and scores, result, comments, signature blocks, and date. Hide application
  navigation and controls on paper.
- Add permitted CSV/Excel exports for individual, department, overall, committee, and score
  summaries. Apply the same authorization and data-minimization rules as the UI.
- Verify Thai text, pagination, signatures, totals, and print output in representative browsers.

**Exit criteria:** users cannot access another teacher's result by changing a URL or export
parameter; finalized reports match stored results and print legibly on A4; exported totals match
the dashboard.

### Phase 7 — Search, notifications, and operational usability

**Outcome:** users can find work quickly and receive useful, accurate status updates.

- Add global search over authorized teacher, staff ID, department, and committee data, with
  round/status/position/rank filters where relevant.
- Add in-app notifications for pending assignments, incomplete work, submissions awaiting HR, and
  finalization. Define read/dismiss behavior and avoid notifications that promise an action the
  system has not completed.
- Add clear empty states, confirmation dialogs, success/error feedback, and keyboard/touch-friendly
  controls across role-specific screens.
- Verify responsive table-to-card behavior and scoring usability on common phone and tablet widths.

**Exit criteria:** search and filters respect user permissions; notifications correspond to real
workflow events; critical tasks can be completed without desktop-only controls.

### Phase 8 — Production readiness and release

**Outcome:** the system can be deployed and operated safely with real institutional records.

- Review authorization for every query, mutation, file, report, and export; run tests for ID
  tampering and committee/teacher isolation.
- Review data retention, privacy notices, access logging, account recovery, staff offboarding,
  backup/restore, and incident response with the college.
- Validate migrations against a non-production database, rehearse backup restoration, and document
  deployment, environment variables, and rollback steps.
- Add production-safe initial-admin provisioning; disable demo identities/data and remove all
  development shortcuts.
- Run lint, typecheck, unit/integration tests, production build, accessibility checks, and a
  role-based end-to-end acceptance pass before release.
- Train HR and committee representatives; run a pilot round, collect feedback, correct workflow
  issues, and obtain HR sign-off before general use.

**Exit criteria:** a rehearsed deployment and recovery path exists; all release checks pass; no
demo-only access remains enabled; HR signs off on policy, reports, and the pilot.

## Demo data

Use the sample data in `PLAN.md` only in a development or demo environment: at least eight teachers
across the listed departments, five committee members, and an academic-year-2569 round 1. Include
mixed assignment and evaluation statuses so dashboards, filters, review queues, and reports can be
exercised. Make the seed idempotent and refuse to run against production.

## Definition of done

A phase is complete only when its exit criteria are met, its behavior is covered by the appropriate
automated tests, its permissions are enforced server-side, and its directly related documentation
is updated. The system is ready for institutional use only after Phase 8 sign-off; a polished UI or
working demo alone is not production readiness.
