# The Viemo Studio Operations Dashboard

A web-based operations hub that brings a venture studio's **business
relationships** and its **project work** into one view.

Built for **Viemo Capital & Consulting Pty Ltd** as project **UG-S2-28**, a
University of Adelaide ICT Capstone placement (INFO3901 / INFO3902), Semester 2
2026.

> **Synthetic data only.** This application is greenfield and self-contained. It
> holds no real relationship, contact or project data and connects to no live or
> confidential system. Every record in the seeded database is invented.

---

## What it is

Three layers on one shared data model:

| Layer | What it does |
|---|---|
| **Dashboard shell** | Navigation, and a home overview that puts relationship health beside project status |
| **BRM module** | Business Relationship Management — a broader alternative to a CRM. Relationship records, types and lifecycle status, an interaction log, and contact-cadence tracking |
| **PM module** | Projects, tasks, owners, statuses and deadlines, with projects as the organising unit |

The two modules never import each other. They meet at exactly two nullable
foreign keys and are joined for display in one place, `lib/dashboard/`. See
[docs/design-and-architecture.md](docs/design-and-architecture.md) for why.

### Why a BRM and not a CRM

A CRM assumes a customer moving along a sales funnel toward a close. A venture
studio's most important relationships — advisors, investors, institutional
partners — are frequently not paying it anything, never "close", and are kept
alive by contact rhythm rather than pipeline stage.

The model reflects that structurally, not just in its labels: the organising
unit is the relationship itself, its status is a cycle rather than a funnel,
value is recorded in both directions, and health is measured as *time since
substantive contact against an agreed cadence*. Full taxonomy in
[docs/brm-taxonomy.md](docs/brm-taxonomy.md).

---

## Running it

Requires **Node.js 20.19+** (developed on 24) and npm.

```bash
npm install
```

```bash
npm run setup
```

`setup` applies the database migrations, generates the Prisma client and seeds
the synthetic data. Then:

```bash
npm run dev
```

Open <http://localhost:3000>.

### Signing in

The seed creates three accounts, one per role, so each role's view can be
inspected. They are listed on the sign-in screen as well.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@viemostudio.example` | `viemo-admin-2026` |
| Member | `member@viemostudio.example` | `viemo-member-2026` |
| Viewer | `viewer@viemostudio.example` | `viemo-viewer-2026` |

> These are demonstration credentials for synthetic data. **Removing the account
> list from the sign-in screen (`app/(auth)/login/page.tsx`) and reseeding with
> new passwords is the first thing to do if this is ever pointed at real data.**

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with a coverage report |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a migration after a schema change |
| `npm run db:reset` | Drop and rebuild the database |
| `npm run db:seed` | Re-seed synthetic data |
| `npm run db:studio` | Prisma Studio, to browse the database |
| `npm run setup` | Migrate, generate and seed in one step |

---

## Technology

| Choice | Why |
|---|---|
| **Next.js 16** (App Router) | One repository and one command to run. Server Components let pages read the database directly, so there is no API layer to keep in step with the UI. |
| **TypeScript** | The domain vocabulary is expressed as types, so an invalid status cannot be written. |
| **Prisma 7 + SQLite** | `prisma/schema.prisma` *is* the shared data model — one readable file, versioned migrations, no database server for a team member to install. |
| **Tailwind CSS v4** | Design tokens in `app/globals.css`; no separate stylesheet to drift. |
| **Zod** | One schema validates every write, on the server. |
| **Vitest** | Fast, and the domain logic is pure functions, so most of it needs no database. |

Passwords are hashed with **scrypt** from Node's standard library — no
dependency, no native build step, and one less package to justify.

---

## Layout

```
app/
  (auth)/login/          Sign in
  (app)/                 Everything behind authentication
    dashboard/           Cross-module overview
    relationships/       BRM module
    projects/            PM module
    admin/               Accounts, roles, integrations
  api/export/            JSON export, via the integration port
components/
  ui/                    Presentational primitives
  domain/                Badges that read the vocabulary
  brm/  pm/  admin/      Module-specific forms
  shell/                 Navigation
lib/
  domain/enums.ts        The controlled vocabulary — the taxonomy in code
  brm/                   Cadence maths, queries, actions
  pm/                    Project health, queries, actions
  dashboard/             The only cross-module reads
  auth/                  Sessions, passwords, RBAC
  integration/           The extension seam
prisma/
  schema.prisma          The shared data model
  seed.ts                Synthetic data
docs/                    Design, taxonomy, user guide, test plan
tests/integration/       Tests that need a real database
```

---

## Documentation

| Document | Contents |
|---|---|
| [Design and architecture](docs/design-and-architecture.md) | The data model, module boundaries, key decisions and the reasoning behind them |
| [BRM taxonomy](docs/brm-taxonomy.md) | Every relationship type and status defined, and how the model differs from a CRM |
| [User guide](docs/user-guide.md) | How to use the delivered application |
| [Test plan and results](docs/test-plan.md) | What is tested, how, and what the last run reported |

---

## Scope

The brief tiers the work. This repository delivers the **must-have core** —
dashboard shell, shared data model, BRM module, PM module — plus role-based
access control, which the brief lists as a stretch item but which was pulled
forward at the client team's request. It is built as an isolated layer
(`lib/auth/permissions.ts`) so it can be removed without touching either module.

Not built, and left as recommendations: relationship-health scoring beyond
cadence, analytics and insight views, and notifications. See the final section
of the design document.

---

## Status

Prototype, ahead of the client requirements meeting. It exists to make the
requirements conversation concrete — showing a working system and asking "is
this what you meant?" tends to surface more than describing one. Expect the
model to change once the client has seen it.
