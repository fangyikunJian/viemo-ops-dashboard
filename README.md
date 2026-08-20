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

Requires **Node.js 20.19+** (developed on 24) and npm. No Docker, and no
database to install.

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run db:up
```

`db:up` starts a Postgres on your machine — Prisma ships it, so there is nothing
to install and no container to run. Leave it running.

```bash
npm run setup
```

`setup` generates the Prisma client, applies the migrations and seeds the
synthetic data. Then:

```bash
npm run dev
```

Open <http://localhost:3000>.

### Signing in

The seed creates three accounts, one per role, so each role's view can be
inspected. They are listed on the sign-in screen as well.

| Role | Sign in with | Password |
|---|---|---|
| **Admin** | **`admin`** | **`admin`** |
| Admin | `admin@viemostudio.example` | `viemo-admin-2026` |
| Member | `member@viemostudio.example` | `viemo-member-2026` |
| Viewer | `viewer@viemostudio.example` | `viemo-viewer-2026` |

Use **`admin` / `admin`** to look around. It exists so a reviewer does not have
to copy a long string off a screen; it bypasses the normal password rules
because the seed hashes directly rather than going through validation.

> **Before this ever touches real data**, in this order: delete the `admin` /
> `admin` account from `prisma/seed.ts`, remove the account list from the
> sign-in screen (`app/(auth)/login/page.tsx`), and reseed with real passwords.
> These are demonstration credentials for a system that holds nothing but
> invented records and connects to nothing.

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
| `npm run db:up` | Start the local Postgres (leave it running) |
| `npm run db:down` | Stop it |
| `npm run db:migrate` | Create and apply a migration after a schema change |
| `npm run db:reset` | Drop and rebuild the database |
| `npm run db:seed` | Re-seed synthetic data |
| `npm run db:studio` | Prisma Studio, to browse the database |
| `npm run setup` | Generate, migrate and seed in one step |

---

## Technology

| Choice | Why |
|---|---|
| **Next.js 16** (App Router) | One repository and one command to run. Server Components let pages read the database directly, so there is no API layer to keep in step with the UI. |
| **TypeScript** | The domain vocabulary is expressed as types, so an invalid status cannot be written. |
| **Prisma 7 + Postgres** | `prisma/schema.prisma` *is* the shared data model — one readable file, versioned migrations. Postgres matches the client's Supabase stack, and `npm run db:up` gives a local one with no Docker and nothing to install. See [ADR-0009](docs/adr/0009-postgres-not-sqlite.md). |
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
| [Team handbook](CONTRIBUTING.md) | **Start here if you are working on this.** Setup, the three architectural rules, where things go, definition of done |
| [Client alignment](docs/client-alignment.md) | **Read before the next client meeting.** Where the brief and the client's vision diverge, and the five questions that need answering |
| [Product specification](docs/product-specification.md) | **For the client.** Every feature and every rule, with the guesses marked as guesses |
| [MVP scope and planning](docs/mvp-scope.md) | What is in, what is out, why — with every brief deliverable traced to where it lives |
| [Design system](docs/design-system.md) | The design layer (rebuildable in Figma) and the framework layer (how it exists in code) |
| [Design and architecture](docs/design-and-architecture.md) | The data model, module boundaries, key decisions and the reasoning behind them |
| [Architecture decisions](docs/adr/README.md) | Nine ADRs — why each choice was made, what was rejected, and what it cost |
| [BRM taxonomy](docs/brm-taxonomy.md) | Every relationship type and status defined, and how the model differs from a CRM |
| [User guide](docs/user-guide.md) | How to use the delivered application |
| [Test plan and results](docs/test-plan.md) | What is tested, how, what the last run reported, and what is still to run |
| [Compliance and standards](docs/compliance-and-standards.md) | Assessment against WCAG 2.2 AA, the Privacy Act 1988 and the Essential Eight — including what is **not** met |
| [Deployment](docs/deployment.md) | Vercel + Supabase + Pages, the migration commands, and what not to deploy where |
| [Demonstration guide](docs/demonstration-guide.md) | A scripted walkthrough for the client meeting and the final presentation |
| [MVP flows](docs/flows.md) | Every flow as a diagram — IA, the core loop, cadence, risk, authorisation, the data model |
| [Team briefing deck](docs/Viemo-UG-S2-28-Team-Briefing.pptx) | 11 slides for the team. Regenerate with `docs/team-briefing-deck.build.js` |

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
