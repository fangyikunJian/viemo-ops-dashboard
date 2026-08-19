# Design and Architecture

**The Viemo Studio Operations Dashboard** · Project UG-S2-28
University of Adelaide ICT Capstone, Semester 2 2026

---

## 1. What the system is for

Viemo Capital & Consulting runs The Viemo Studio, an early-stage South
Australian venture studio. Two things determine whether a studio like it
succeeds: the relationships it maintains, and the project work it delivers.
Those two things are normally tracked in different tools, by different people,
in different rhythms — so nobody can answer the question the studio actually
cares about, which is *how are we doing*.

This system answers that question on one screen.

It comprises a dashboard shell and two founding modules on a shared data model:

- a **Business Relationship Management (BRM)** module, a broader alternative to
  a conventional CRM
- a **Project Management (PM)** module for tracking projects, tasks, owners,
  statuses and deadlines

The dashboard layer sits above both and presents relationship health beside
project status.

The project is greenfield and self-contained: synthetic data, no connection to
any live or confidential system.

---

## 2. What makes a BRM different from a CRM

This is the intellectual core of the project, so it is worth stating precisely.
A BRM is not a CRM with the word "customer" replaced.

| | CRM | BRM |
|---|---|---|
| Organising unit | Deal or opportunity | The relationship itself |
| Status semantics | Pipeline stage; ordered, terminal, advances toward a close | Lifecycle; a cycle a relationship can move around in either direction |
| Core measure | Deal value, conversion rate, time to close | Time since substantive contact, against an agreed cadence |
| Value | One direction — they pay you | Two directions — recorded explicitly, both ways |
| Who counts | Customers and prospects | Advisors, investors, delivery partners, institutions, suppliers **and** customers |
| What "done" means | Won or lost; the record leaves the board | Nothing is ever done; a dormant relationship is still a relationship |

Four consequences fall out of that, and each is visible in the schema rather
than only in the interface:

1. **`Relationship` is a first-class entity**, not an attribute of an
   organisation. An independent advisor is a relationship with no organisation
   at all, and that is the normal case rather than an edge case to be modelled
   around with a placeholder company.
2. **Status is a cycle, not a funnel.** `PROSPECTIVE → ACTIVE → DORMANT →
   ARCHIVED` are four states a relationship moves between, in any direction,
   over years. Nothing in the code treats a later state as better than an
   earlier one.
3. **Cadence is a first-class field.** Each relationship carries the rhythm it
   should be maintained at, and the system measures it against its own rhythm
   rather than a shared rule. A quarterly advisor and a fortnightly customer are
   both healthy, at very different contact frequencies.
4. **Value is bidirectional.** `valueToUs` and `valueToThem` are two fields, not
   one. The second is the one teams forget, and it is the one that determines
   whether a relationship survives.

Full definitions of every term are in [brm-taxonomy.md](brm-taxonomy.md).

---

## 3. Architecture

### 3.1 The shape

```
┌──────────────────────────────────────────────────────────┐
│  app/(app)/dashboard   — the cross-module view            │
└───────────────┬──────────────────────────────────────────┘
                │  reads through
┌───────────────▼──────────────────────────────────────────┐
│  lib/dashboard/       — the ONLY cross-module reads       │
└───────┬──────────────────────────────────┬───────────────┘
        │                                  │
┌───────▼─────────┐                ┌───────▼─────────┐
│  lib/brm/       │  ✗ no imports  │  lib/pm/        │
│  cadence        │ ◄────────────► │  project health │
│  queries        │     between    │  queries        │
│  actions        │      them      │  actions        │
└───────┬─────────┘                └───────┬─────────┘
        │                                  │
┌───────▼──────────────────────────────────▼───────────────┐
│  prisma/schema.prisma  — the shared data model            │
└──────────────────────────────────────────────────────────┘
```

### 3.2 The module boundary rule

**`lib/brm` and `lib/pm` never import each other.** Any code needing both lives
in `lib/dashboard`.

This is the most consequential structural decision in the project, and it was
made for a specific reason: the brief allocates five workstreams to five or six
students working in parallel. If the BRM and PM modules could reach into each
other, every change in one would risk breaking the other, and the two groups
would spend the semester merging instead of building. With the rule in place,
each group owns a directory.

It also means either module can be demonstrated on its own, so integration is
not a cliff at the end of the project.

### 3.3 The two seams

The modules meet at exactly two places, both nullable foreign keys:

| Seam | Meaning |
|---|---|
| `Project.relationshipId` | Which relationship this project is being delivered for or with |
| `Interaction.projectId` | Which project a touchpoint was about |

Nullable is the point. A project can be internal; a conversation need not be
about a project. Neither module requires the other to exist in order to work.

---

## 4. The shared data model

```
User ──────────────┐
  role: ADMIN|MEMBER|VIEWER
Session ───────────┤
                   │
TeamMember ◄───────┘  owns / leads / is assigned / logs
   ▲  ▲  ▲  ▲
   │  │  │  └──────────────── Task.assigneeId
   │  │  └───────────── Project.leadId
   │  └────────── Interaction.loggedById
   └───── Relationship.ownerId

Organisation ◄── Relationship.organisationId   (optional grouping)

Relationship ──┬── Contact          (people to speak to)
               ├── Interaction      (the touchpoint log)
               └── Project          ◄── seam

Project ───────┬── Task
               └── Interaction      ◄── seam

Tag ──────────── Relationship, Project   (shared vocabulary)
```

### 4.1 Enumerations are strings

`type`, `status`, `channel` and `priority` are
`String` columns. The permitted values live once in `lib/domain/enums.ts` as
`const` arrays, with a Zod schema and a TypeScript union derived from each.
Every write validates against them; every screen reads its labels from them.

This turned out better than a database enum would have been: the same module
carries each term's human definition and badge colour, so the taxonomy in the
documentation, the taxonomy in the interface and the taxonomy in the type system
are one object and cannot drift.

### 4.2 Derived values are computed, not stored

| Value | Computed by |
|---|---|
| Cadence status | `lib/brm/cadence.ts` |
| Project progress | `lib/pm/project-health.ts` |
| Project risk | `lib/pm/project-health.ts` |

All are pure functions of their inputs and an explicit `now`, with no clock
reads and no database access. Two benefits: they cannot fall out of step with
the records they describe, and they can be unit-tested exhaustively without any
test database. Most of the test suite is possible because of this decision.

### 4.3 The one deliberate exception

`Relationship.lastContactAt` **is** stored, duplicating something derivable from
the interaction log.

The reason is the dashboard: it computes a cadence status for every relationship
at once, and deriving each from an aggregate over its interactions would turn
one query into a query per relationship.

The cost of denormalising is drift, and it is paid in one place.
`lib/brm/record-interaction.ts` is the only module permitted to write the field,
and every operation on the interaction log — create, edit, delete — goes through
it and **recomputes the value from scratch inside the same transaction**.

Recomputing rather than comparing matters. A naive
`if (newDate > lastContactAt)` looks correct and is wrong three ways: it leaves
the field stale when the most recent interaction is deleted, when the latest is
downgraded to incidental, and when a backdated entry arrives. All three are
covered in `tests/integration/record-interaction.test.ts`.

### 4.4 Substantive versus incidental

Only interactions flagged `isSubstantive` reset the cadence clock. Forwarding an
article is contact; it is not the conversation the cadence exists to make sure
happens. This small flag is one of the clearest expressions of what a BRM is
for, and it is why the cadence figure means something.

---

## 5. Cadence: the health signal

```
clockStart = lastContactAt ?? createdAt
dueAt      = clockStart + cadenceDays
warning    = clamp(ceil(cadenceDays × 0.2), 1, 30)

NOT_TRACKED  no cadence set, or status is DORMANT / ARCHIVED
OVERDUE      today is past dueAt
DUE_SOON     dueAt is within the warning window
ON_TRACK     otherwise
```

Three decisions inside that are worth defending:

**A relationship with no cadence is `NOT_TRACKED`, not overdue.** The model draws
a hard line between a relationship deliberately left off a rhythm and one being
neglected. Collapsing them would make the overdue count — the single number the
dashboard exists to keep at zero — meaningless.

**Dormant and archived relationships are not chased.** Dormant is a legitimate
resting state. Reporting a relationship you have chosen to rest as overdue asks
the team to act on their own decision.

**A relationship never contacted has its clock run from when it was added.**
Adding it is what creates the obligation to make first contact, so a new prospect
gets its full first window before it is chased — and it still cannot disappear,
because it has a real due date.

The warning window is capped at 30 days. A fifth of a year is 73 days, which
would leave an annual relationship flagged as needing attention for a fifth of
its life, and a warning that is always on carries no information.

---

## 6. Access control

Three roles, one table, one function.

| | Viewer | Member | Admin |
|---|---|---|---|
| Read both modules | ● | ● | ● |
| Create and edit records | | ● | ● |
| Archive | | ● | ● |
| Delete permanently | | | ● |
| Manage accounts | | | ● |

The line between **archive** and **delete** is the interesting one. Archiving is
reversible and keeps the interaction history that explains why a relationship
went the way it did; deleting destroys it. Members archive; only administrators
delete.

### 6.1 Where it is enforced

Three layers, of which only one is a boundary:

1. **The interface** hides controls a role cannot use. A courtesy — it stops
   people being shown doors they cannot open.
2. **Route guards** (`requirePermission` in `lib/auth/session.ts`) redirect a
   user away from a page they may not read.
3. **Server actions** call `can()` before touching anything. **This is the
   boundary that actually holds.** Every write checks, on the server, before
   reading the form.

`lib/auth/permissions.ts` is a pure function over a small table, importing
nothing but a type. It can be read in one screen and tested without a database,
and `lib/brm` and `lib/pm` contain no permission logic at all — so the whole
layer could be tightened, replaced or removed without either module noticing.

### 6.2 Two guards worth naming

An administrator cannot demote or deactivate themselves out of the last active
admin account, and deactivating an account deletes its live sessions rather than
waiting for the cookie to expire. Both are enforced in the action, not the UI.

### 6.3 Note on scope

The brief lists role-differentiated views as a **stretch** item. It was pulled
into the core at the client team's request. Building it as an isolated layer was
the mitigation: if the semester runs short, deleting `lib/auth/` and the three
`can()` calls per module removes it without disturbing the delivered core.

---

## 7. Sessions and passwords

Sessions are database-backed with an opaque cookie. The session identifier is
256 bits from `randomBytes`, not the schema's default `cuid` — a cuid encodes a
timestamp and a counter, which is fine for a record identifier and unsuitable
for a bearer token.

Passwords use **scrypt** from Node's standard library, salted per password,
compared in constant time. No dependency, no native build step on any team
member's machine, and one fewer package to justify in this document.

`lib/auth/password-rules.ts` holds the rules with no Node imports, separately
from the hashing. This is not tidiness: importing `node:crypto` from a client
component fails at runtime with an error pointing at `util.promisify` rather
than at the real cause. Splitting the module makes that mistake impossible.

---

## 8. The extension seam

The brief asks integration to include "a lightweight, stubbed interface for
future extensions". `lib/integration/` is it: a port describing what any
outbound integration must do, with adapters behind it.

Two adapters ship:

- **`jsonExportAdapter`** — real, and used by `/api/export`. It proves the seam
  works end to end rather than being an interface nobody has run through.
- **`jiraStubAdapter`** — documented, deliberately unimplemented.

The Jira stub deserves a note, because "why not just build on Jira's API?" is a
reasonable question and the answer is not obvious.

Three things stand between the stub and a working adapter: credentials and a
tenant, which need a secret store the application does not have; a field mapping
that loses nothing important; and a conflict policy for when a task changes on
both sides, which is a client decision rather than a technical one.

The second is the substantive objection. Projects and tasks map across cleanly
enough. **The BRM half of the model has no counterpart in Jira at all** — no
relationships, no cadence, no bidirectional value — which is the clearest
possible statement of why this system is not a Jira front end. Building on an
external product's API would also delete the shared data model, which the brief
names as a deliverable in its own right.

An honest stub is worth more than a half-working connection.

---

## 9. Interface decisions

**Colour is computed, not chosen.** The palette in `app/globals.css` comes from a
validated data-visualisation palette, checked for colour-vision-deficiency
separation and contrast against both light and dark surfaces.

**Status colour never carries meaning alone.** Two of the four status colours sit
below 3:1 contrast on the light surface, so every place one appears it is paired
with an icon and a written label — "Overdue · 17 days over", not a red dot.

**The dashboard leads with four numbers, not a chart.** Each is a single current
value; a one-bar bar chart would say the same thing with more ink. Where a chart
does appear — relationships by type, projects by status — it is a horizontal bar
list in one hue, because the reader's job is comparing magnitudes.

**Filters live in the URL.** A filtered view can be linked, bookmarked and
shared, which is what lets a stat tile point at *the six overdue relationships*
rather than just displaying the number six.

---

## 10. Testing

79 tests across six files. See [test-plan.md](test-plan.md) for the full plan.

The strategy follows the architecture. Because the derived values are pure
functions, cadence and project health are tested exhaustively with no database
at all — including the cases that are awkward to reach through the interface,
such as a cadence of zero or a relationship never contacted.

The one place a real database is required is the `lastContactAt` invariant, and
that gets an integration suite of its own, running against a throwaway Postgres
schema built from the project's real migrations.

---

## 11. Known limitations

- **No connection pooling of our own.** Fine against a managed Postgres, which
  pools for us; a self-hosted deployment would want PgBouncer in front.
- **No pagination.** The relationship and project lists load everything. At the
  scale a venture studio operates — tens to low hundreds of relationships — this
  is the right trade. It would not survive thousands.
- **Cadence filtering happens in application code**, because cadence is derived
  and cannot be expressed in SQL against the current schema.
- **The audit trail is not fully transactional.** Where an action already runs
  in a transaction the entry commits with it; where the action is a single
  Prisma call the entry is written immediately after, leaving a one-statement
  window in which a change could exist without its record. Named in
  `lib/audit/record.ts` rather than hidden.
- **Search is a substring match on name.** No fuzzy matching, no searching
  interaction text.

---

## 12. Recommendations for future development

In the order they would pay off:

1. **Take it to the client before building anything else.** This was written
   ahead of the requirements meeting. The relationship taxonomy is the part most
   likely to be wrong, and it is cheap to change now and expensive later.
2. **Relationship-health scoring** beyond cadence — weighting by type, recency
   and reciprocity. The data to compute it is already recorded; only the formula
   is missing, and it should be agreed with the client rather than invented.
3. **Notifications.** The overdue count is only useful to someone looking at it.
   A weekly digest to each relationship owner would change it from a report into
   a prompt.
4. **Analytics views** — contact frequency over time, interaction volume by
   type, project throughput.
5. **An audit trail**, before more than a handful of people share the system.
6. **Pagination and full-text search**, when the data outgrows one page.
