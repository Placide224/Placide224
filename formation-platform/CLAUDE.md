# NT7East / FormationStudio — Project Governance

This file is the technical "constitution" for the project. It exists so every
future change (by a human or by Claude Code) follows the same rules instead of
re-deriving architecture decisions each session. Update it whenever a rule
changes — don't let it drift from reality.

## Vision & sequencing

The long-term product is NT7East: a multi-pillar platform (Education /
Business / Finance) built on a shared Identity, Organizations, Data and AI
layer. We are NOT building all pillars at once. Current sequence:

1. **Socle (in progress)**: Identity + Organizations + RBAC, layered onto the
   existing FormationStudio module without breaking it.
2. FormationStudio hardening (skills/competencies, versioning).
3. BusinessStudio, FinanceStudio, DataStudio/AI, Education Management System,
   Marketplace — each only after the previous layer is stable and validated.

Every new module attaches to Identity/Organizations — never build a
module-local user/account system again.

## Architecture

- Next.js App Router, Server Actions for mutations, Server Components for
  reads. Avoid client components unless the UI needs local interactivity
  (forms with client-side validation, generated-content review panels).
- **Modular monolith.** One Next.js app, one database, domain logic separated
  by folder (`lib/formations.ts`, `lib/organizations.ts`, etc.), not by
  service. Do not split into microservices until a module has outgrown the
  monolith in practice, not in anticipation.
- Prisma is the only way the app talks to Postgres. No raw SQL except inside
  a reviewed migration.

## Identity & Organizations (RBAC)

- One account per person (`User`), platform-wide. Never build a second,
  module-local account system.
- `Organization` represents a tenant: a school, company, university, NGO, or
  an individual's personal workspace. Multi-tenant from day one.
- `Membership` links a `User` to an `Organization` with a role
  (`OWNER` > `ADMIN` > `CREATOR` > `MEMBER`). Authorization checks should
  prefer membership roles over ad-hoc flags once a resource belongs to an
  organization.
- `User.role` (ADMIN/CREATOR/LEARNER) is the **platform-level** role
  (NT7East staff vs. everyone else) — it is not a substitute for
  organization-level RBAC and should shrink in scope over time, not grow.
- A resource (Formation, and future Business/Finance entities) may belong to
  an `Organization` (shared, multi-editor) or be personal (`organizationId`
  null, owned solely by its creator). Don't force every resource into an
  organization before there's a real need.

## Database

- Every schema change is a Prisma migration, committed to the repo
  (`prisma/migrations/`). Never edit the database by hand.
- Additive changes only when possible: new tables, new nullable columns.
  Destructive changes (drop column/table, non-nullable without a default on
  an existing table) require an explicit callout to the user before running,
  since `prisma migrate deploy` runs automatically on every production
  deploy (see below).
- Use `cuid()` ids, `onDelete: Cascade` for owned child records, explicit
  `@@index`/`@@unique` for every foreign key and lookup column.

## Security

- Every Server Action re-checks authorization itself
  (`requireUser`/`requireCreator`/`assertFormationAccess`/org membership) —
  never rely on a page-level redirect or hidden UI as the only guard.
- Validate all external input (`FormData`, query params) before using it;
  never trust a client-supplied id as proof of ownership — always re-derive
  ownership from the session and the database.
- Secrets (`DATABASE_URL`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`, any future
  payment/API key) live only in Vercel Environment Variables, never in a
  `NEXT_PUBLIC_*` var, never committed to git.
- Passwords are always hashed with bcrypt (cost 12) — never stored or logged
  in plaintext.

## Deployment

- `main` is production. Vercel auto-deploys on every push to `main`.
- The build command runs `prisma migrate deploy` before `next build`, so
  schema migrations apply to the production database automatically on
  deploy. This means: a migration merged to `main` takes effect immediately
  in production — treat every migration with the care that implies.
- Local development and Claude Code sessions use a separate database (local
  Postgres or a dev branch) — never point local `.env` at the production
  `DATABASE_URL`.

## Conventions

- French for all user-facing text (labels, buttons, error messages). English
  for code identifiers, comments, and this file.
- Tailwind utility classes only, no separate CSS files beyond
  `globals.css`.
- No comments explaining *what* code does — only *why*, when non-obvious.
- Don't add a feature, table, or abstraction the current step doesn't need.
  Point at the roadmap above instead of pre-building for a future phase.

## Always / Never

- **Always** re-validate authorization inside Server Actions.
- **Always** keep new modules additive to Identity/Organizations, not
  parallel to it.
- **Never** store secrets in `NEXT_PUBLIC_*` variables or in git.
- **Never** run a destructive migration without flagging it explicitly first.
- **Never** give financial or investment advice from FinanceStudio (when
  built) — information, analytics, and simulation only, until a separate,
  legally reviewed advisory module exists.

@AGENTS.md
