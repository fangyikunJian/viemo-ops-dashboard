# MVP Scope and Planning

**The Viemo Studio Operations Dashboard** · Project UG-S2-28
University of Adelaide ICT Capstone · Semester 2 2026

What the minimum viable product is, why each item is in or out, and how every
line traces back to the placement brief.

---

## 1. The product in one sentence

> A web-based hub that brings a venture studio's **relationships** and its
> **project work** into one operational picture, where the health of a
> relationship is measured by whether it is being maintained — not by whether it
> is about to buy something.

---

## 2. What makes this an MVP rather than a demo

An MVP has to be **viable**: someone could use it to do real work, even if
narrowly. Three things had to be true, and each drove a scope decision.

| It must | So the scope includes |
|---|---|
| Answer a question nobody can currently answer | The cadence calculation and the overdue count. Without them this is a contact list. |
| Be usable by more than one person | Accounts and roles, so an advisor can be given read-only access |
| Survive being wrong | Every record editable, archiving reversible, interaction history retained |

And two things it deliberately does **not** need to be viable: notifications
(the dashboard is the notification), and analytics (there is not yet enough
history to analyse).

---

## 3. Scope tiers

The brief tiers this explicitly: a must-have core is the primary target, and a
separated stretch tier is attempted only once the core is complete. That
structure is preserved below.

### Tier 0 — Foundation · **Delivered**

| Item | Status | Evidence |
|---|---|---|
| Shared data model | ✅ | `prisma/schema.prisma`, 10 entities, versioned migration |
| Controlled vocabulary | ✅ | `lib/domain/enums.ts`, six vocabularies with definitions |
| Synthetic seed data | ✅ | 23 relationships, 119 interactions, 10 projects, 53 tasks |
| Design system | ✅ | [design-system.md](design-system.md) |
| Dashboard shell and navigation | ✅ | `app/(app)/layout.tsx`, `components/shell/` |

### Tier 1 — Core · **Delivered**

| # | Requirement | Status | Where |
|---|---|---|---|
| C1 | Create, read, update relationships | ✅ | `/relationships` |
| C2 | Relationship types and lifecycle status | ✅ | Six types, four statuses |
| C3 | Interaction / touchpoint log | ✅ | Relationship detail |
| C4 | Contact-cadence tracking | ✅ | `lib/brm/cadence.ts`, 27 tests |
| C5 | Contacts within a relationship | ✅ | With a primary contact |
| C6 | Create, read, update projects | ✅ | `/projects` |
| C7 | Tasks with owners, statuses, deadlines | ✅ | Four-column board |
| C8 | Project progress and risk | ✅ | `lib/pm/project-health.ts`, 19 tests |
| C9 | Home overview across both modules | ✅ | `/dashboard` |
| C10 | Modules joined on the shared model | ✅ | Two nullable seams |
| C11 | Stubbed interface for future extensions | ✅ | `lib/integration/` |

### Tier 1.5 — Pulled forward from stretch · **Delivered**

Role-based access control. The brief lists role-differentiated views as
**stretch**; the client team asked for it in the core.

Built as an isolated layer so the trade-off is reversible: deleting `lib/auth/`
and the `can()` calls removes it without disturbing the delivered core. See
[ADR-0006](adr/0006-authorise-inside-server-actions.md).

| # | Requirement | Status |
|---|---|---|
| R1 | Sign in, sessions | ✅ |
| R2 | Three roles: Viewer, Member, Admin | ✅ |
| R3 | Server-side enforcement on every write | ✅ |
| R4 | Account management | ✅ |

### Tier 2 — Stretch · **Not built, deliberately**

| # | Item | Why not, and what it needs first |
|---|---|---|
| S1 | Relationship-health scoring | The data is already recorded; only the formula is missing. It should be **agreed with the client**, not invented — a score nobody believes is worse than no score. |
| S2 | Analytics and insight views | Needs history the synthetic data cannot honestly simulate. Meaningful after a few months of real use. |
| S3 | Notifications and digests | The highest-value stretch item: it turns the overdue count from a report into a prompt. Needs email infrastructure and a client decision on frequency. |
| S4 | Role-differentiated dashboards | Roles exist; the dashboard is the same for all. "My relationships" and "my tasks" views are a small increment. |

### Out of scope — with reasons

| Item | Why |
|---|---|
| Live integration with Jira, a CRM, or email | The brief specifies greenfield and self-contained, on synthetic data, with no connection to live systems. The seam is built instead — [ADR-0007](adr/0007-integration-port-not-live-connection.md). |
| Mobile application | Not asked for. The web interface is responsive. |
| Multi-tenancy | One studio. |
| File attachments | Storage, virus scanning and retention are a project of their own. |
| Calendar or email sync | Requires OAuth against live accounts, which the brief rules out. |

---

## 4. Traceability

Every deliverable named in the brief, and where it is.

| Brief deliverable | Where |
|---|---|
| Working web application (MVP) | This repository |
| Source in version control, README, setup instructions | [README](../README.md) |
| Design and architecture document | [design-and-architecture.md](design-and-architecture.md) + [8 ADRs](adr/README.md) |
| BRM relationship taxonomy, and how it differs from a CRM | [brm-taxonomy.md](brm-taxonomy.md) |
| Key design decisions and technology stack | [ADR-0005](adr/0005-nextjs-prisma-sqlite.md), README §Technology |
| Brief user guide | [user-guide.md](user-guide.md) |
| Testing evidence — plan and results | [test-plan.md](test-plan.md) |
| Final presentation and demonstration | [demonstration-guide.md](demonstration-guide.md) |
| Recommendations for future development | §6 below, and design doc §12 |

Brief activities, and where each landed.

| Activity | Outcome |
|---|---|
| Requirements and discovery | **Incomplete** — the client meeting had not happened when this was built. Open questions are in [brm-taxonomy.md §9](brm-taxonomy.md). |
| Research and design of the BRM model | The taxonomy document and `lib/domain/enums.ts` |
| Information architecture and UX design | [design-system.md](design-system.md) §6 |
| Design of the shared data model | `prisma/schema.prisma` |
| Build the BRM module | `lib/brm/`, `app/(app)/relationships/` |
| Build the PM module | `lib/pm/`, `app/(app)/projects/` |
| Build the dashboard shell | `app/(app)/layout.tsx`, `/dashboard` |
| Integration, including a stubbed interface | `lib/dashboard/`, `lib/integration/` |
| Testing — plan, feature testing, bug fixing | 102 automated tests; 8 defects found and fixed |
| Documentation | Nine documents in `docs/` plus the README and handbook |
| Project management | Team's own Jira, outside this repository |
| Final presentation | [demonstration-guide.md](demonstration-guide.md) |

---

## 5. Workstream allocation

The brief allocates 130 hours per student across five workstreams. The directory
layout follows it, so each person mostly stays in their own tree.

| Workstream | Owns | Core artefacts |
|---|---|---|
| Shell & shared data layer | `prisma/`, `lib/domain/`, `lib/db.ts`, `components/shell/` | Schema, vocabulary, navigation |
| BRM module | `lib/brm/`, `components/brm/`, `app/(app)/relationships/` | Cadence, interaction log |
| PM module | `lib/pm/`, `components/pm/`, `app/(app)/projects/` | Health, task board |
| UX & design | `app/globals.css`, `components/ui/`, `components/domain/` | Design system, accessibility |
| Integration & testing | `lib/dashboard/`, `lib/integration/`, `tests/`, `.github/` | Cross-module reads, CI, test plan |

**Two files touch everyone**: `prisma/schema.prisma` and `lib/domain/enums.ts`.
Changes to either are flagged before the pull request opens.

---

## 6. What to do next, in order

1. **Take it to the client.** This was built before the requirements meeting.
   The relationship taxonomy is the part most likely to be wrong and the
   cheapest to change now. Five specific questions are listed in
   [brm-taxonomy.md §9](brm-taxonomy.md).
2. **Run the remaining 26 manual test cases**, and do a screen-reader pass.
   Accessibility carries real legal exposure in Australia and automated checks
   find perhaps a third of real barriers.
3. **Agree the relationship-health formula** with the client, then build S1.
4. **Add an audit trail.** Needed before more than a handful of people share
   the system, and it unblocks the privacy accountability gap.
5. **Notifications (S3).** The highest-value stretch item.
6. **Analytics (S2)**, once there is history worth analysing.

---

## 7. Honest status

**The core is complete and verified.** 102 automated tests, CI green, zero
measured accessibility contrast failures, a production build that runs.

**It is a prototype, not a production system.** It has no multi-factor
authentication, no audit trail, no backups, and no assistive-technology
verification. 26 of 41 manual test cases have not been run. All of this is
itemised in [compliance-and-standards.md](compliance-and-standards.md) rather
than left to be discovered.

Saying "the core is complete, and the compliance assessment lists what is not"
is a stronger claim than "it is finished", because it is checkable.
