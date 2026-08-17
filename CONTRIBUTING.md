# Team Handbook

**The Viemo Studio Operations Dashboard** · Project UG-S2-28

How to work in this codebase. Read the first three sections before your first
commit; the rest is reference.

---

## 1. Get it running

You need **Node 20.19 or newer** (`.nvmrc` pins 24.13.0) and npm. Nothing else
— no database server to install, because the database is a file.

```bash
git clone https://github.com/fangyikunJian/viemo-ops-dashboard.git
```

```bash
cd viemo-ops-dashboard && npm install
```

```bash
cp .env.example .env
```

```bash
npm run setup
```

```bash
npm run dev
```

Open <http://localhost:3000>. Sign-in details are printed by the seed and shown
on the sign-in screen.

**If something is wrong**, the fastest reset is `npm run db:reset && npm run db:seed`.
It drops the database and rebuilds it. You will lose local data; the data is
synthetic, so that is fine.

---

## 2. The three rules

Break these and the review will ask you to change it, so they are worth knowing
before you start.

### Rule 1 — `lib/brm` and `lib/pm` never import each other

They communicate only through the schema. Anything needing both modules goes in
`lib/dashboard`.

This is what lets five people work at once without merging into each other all
semester. If you find yourself wanting to import across, the thing you want
belongs in `lib/dashboard` or in `lib/domain`.

```
✗  lib/pm/queries.ts        import { computeCadence } from "@/lib/brm/cadence"
✓  lib/dashboard/queries.ts import { computeCadence } from "@/lib/brm/cadence"
                            import { computeProjectHealth } from "@/lib/pm/project-health"
```

### Rule 2 — every write checks permission on the server

The first lines of any server action that changes data:

```ts
const user = await requireUser();
if (!can(user.role, "create", "relationship")) {
  return { error: "Your role cannot create relationships." };
}
```

Hiding a button is a courtesy, not a control. A user who can construct a POST
can reach any action whose UI they cannot see.

### Rule 3 — derived values are computed, never stored

Cadence status, project progress and project risk are pure functions. Do not add
a column that caches one. If you think you need to, read
[ADR 0002](docs/adr/0002-derive-values-rather-than-store-them.md) first — there
is exactly one exception in the codebase, it is documented, and it is defended
by its own test suite.

---

## 3. Where things go

| I want to add… | It goes in |
|---|---|
| A new relationship type, status, channel, priority | `lib/domain/enums.ts` — and nowhere else |
| A calculation about relationships | `lib/brm/` |
| A calculation about projects or tasks | `lib/pm/` |
| Something that needs both modules | `lib/dashboard/` |
| A database field | `prisma/schema.prisma`, then `npm run db:migrate` |
| A form that writes data | A server action in the module's `actions.ts` |
| A screen | `app/(app)/<module>/` |
| A reusable visual piece | `components/ui/` |
| A piece that knows the domain vocabulary | `components/domain/` |
| A permission rule | `lib/auth/permissions.ts` |
| A way to send data elsewhere | An adapter in `lib/integration/adapters.ts` |

**Adding a vocabulary term** is the most common change and the easiest to get
wrong. `lib/domain/enums.ts` holds the value, the human label, the definition
shown on hover, and the badge colour, all in one object. Add it there and the
list screens, the filters, the forms, the badges and the taxonomy documentation
all pick it up. Add it anywhere else and you will be chasing it around the
codebase for an afternoon.

---

## 4. Changing the database

```bash
npm run db:migrate
```

Prisma will ask for a name — use something descriptive, like
`add_relationship_priority`. This writes a migration file to
`prisma/migrations/`, which **must be committed**. Migrations are how everyone
else's database gets the same change.

Never edit a migration that has been pushed. Write a new one.

After a schema change, update `prisma/seed.ts` so the synthetic data still fits.
CI runs the seed for exactly this reason.

---

## 5. Testing

```bash
npm test
```

```bash
npm run test:watch
```

**What must have a test:**

- Any pure function in `lib/` that makes a decision. Cadence, health, and
  permissions are the pattern to copy.
- Any bug you fix. Write the failing test first, then fix it. A bug without a
  test comes back.

**What does not need one:** thin server actions that only validate, check a
permission and call Prisma. They are covered by the manual script in
[docs/test-plan.md](docs/test-plan.md).

**Write tests that say why.** Compare these two:

```ts
it("returns NOT_TRACKED", () => { … })
```

```ts
it("does not track dormant relationships even when they have a cadence", () => {
  // Dormant is a deliberate resting state. Chasing it would defeat the
  // purpose of having the state at all.
  …
})
```

The second one survives a refactor, because the next person can tell whether
breaking it is a bug or an intended change.

---

## 6. Branching and pull requests

```bash
git switch -c brm/relationship-tags
```

Branch names: `<module>/<what>` — `brm/…`, `pm/…`, `dashboard/…`, `auth/…`,
`docs/…`.

**Never push to `main` directly.** Open a pull request. CI runs typecheck, lint,
tests, build and the seed on every PR; a red build does not merge.

Before you open the PR, run the same four things locally:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

### Definition of done

A change is done when all of these are true:

- [ ] The four checks above pass locally
- [ ] New decision logic has a test that states why, not just what
- [ ] A schema change has its migration committed and the seed still runs
- [ ] Writes check permission on the server
- [ ] Any new vocabulary is in `lib/domain/enums.ts` with a real definition
- [ ] New colour combinations clear 4.5:1 (see §8)
- [ ] Documentation that is now wrong has been fixed in the same PR

---

## 7. Commit messages

Subject line in the imperative, under about 70 characters:

```
Add relationship tag filtering to the list screen
```

Then a blank line and a body that explains **why**, not what — the diff already
says what. If the change involved a trade-off, say what you traded and what you
got. Look at `git log` for the shape.

The body is where a future team member finds out that a decision was
deliberate rather than accidental. That is worth two minutes.

---

## 8. Conventions that are not obvious

**Australian English and Australian dates.** `organisation`, not
`organization`. Dates render as `17 Aug 2026` through `lib/format.ts` — never
build a date string by hand.

**Colour comes from tokens, never a hex value in a component.** The tokens are
in `app/globals.css` and are chosen for measured contrast, not appearance. Any
new text/background pair must clear **4.5:1**; you can check one in the browser
console with the snippet in [docs/compliance-and-standards.md](docs/compliance-and-standards.md).

**Status colour never carries meaning alone.** Every status gets an icon and a
word beside it. Two of the four status colours are below 3:1 on the light
surface, and about one man in twelve cannot separate red from green.

**Icons are decorative.** Every `<svg>` gets `aria-hidden="true"` unless it is
the only content of a control, in which case its parent needs an `aria-label`.

**Server Components by default.** Add `"use client"` only when you need state,
an effect or an event handler. A page that only reads and renders should stay
on the server.

**Never import from `lib/auth/password` in a client component.** It pulls
`node:crypto` into the browser bundle and the page dies at runtime with an
error that points somewhere else entirely. Import `lib/auth/password-rules`.

---

## 9. Workstreams

The brief splits the work five ways. The directory layout follows it, so each
person can mostly stay in their own tree.

| Workstream | Owns |
|---|---|
| Shell & shared data layer | `prisma/`, `lib/domain/`, `lib/db.ts`, `components/shell/`, `app/(app)/layout.tsx` |
| BRM module | `lib/brm/`, `components/brm/`, `app/(app)/relationships/` |
| PM module | `lib/pm/`, `components/pm/`, `app/(app)/projects/` |
| UX & design | `app/globals.css`, `components/ui/`, `components/domain/` |
| Integration & testing | `lib/dashboard/`, `lib/integration/`, `tests/`, `.github/workflows/`, `docs/test-plan.md` |

Changes to `prisma/schema.prisma` and `lib/domain/enums.ts` touch everyone.
Flag them in the group chat before you open the PR.

---

## 10. Where to read more

| Document | When you need it |
|---|---|
| [README](README.md) | Setup, commands, what the thing is |
| [Design and architecture](docs/design-and-architecture.md) | How it fits together and why |
| [Architecture decisions](docs/adr/README.md) | Why a specific choice was made, and what it cost |
| [BRM taxonomy](docs/brm-taxonomy.md) | What a term means before you use it in code |
| [Test plan](docs/test-plan.md) | What is covered, what is not, what still needs running |
| [Compliance and standards](docs/compliance-and-standards.md) | Accessibility, privacy and security obligations |
| [MVP flows](docs/flows.md) | The diagram of a flow you are about to change |
| [Design system](docs/design-system.md) | Tokens, components and the contracts behind them |
| [Demonstration guide](docs/demonstration-guide.md) | Before you present to the client |
| [User guide](docs/user-guide.md) | What the application does, from a user's side |
| [Team briefing deck](docs/Viemo-UG-S2-28-Team-Briefing.pptx) | The ten-minute version of all of the above |
