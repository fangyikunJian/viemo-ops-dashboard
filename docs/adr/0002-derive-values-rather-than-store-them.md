# ADR-0002 — Derive cadence, progress and risk rather than storing them

**Status:** Accepted · 17 August 2026

## Context

Three values drive the dashboard: a relationship's cadence status, a project's
progress, and whether a project is at risk. Each could be a stored column updated
on write, or computed on read.

Stored columns are cheap to read and are what an ORM nudges you toward. They are
also how dashboards start lying: a column updated in four places is a column that
is wrong in at least one of them, and nothing tells you which.

## Decision

All three are computed by pure functions of their inputs and an **explicit
`now`** — no clock reads, no database access, no ambient state.

One exception, taken deliberately: `Relationship.lastContactAt` is stored.

## Consequences

**Good.** A derived value cannot drift from the records it describes, because it
has no independent existence. Passing `now` in makes every time-dependent case
testable without mocking a clock — which is why cadence has 27 tests covering
things no interface can easily produce, such as a cadence of zero.

**Bad.** Cadence cannot be filtered or ordered in SQL, so the relationship list
loads all rows and filters in application code. Acceptable at the scale a venture
studio operates; it would not survive tens of thousands of rows.

### The exception, and its price

The dashboard computes a cadence status for every relationship at once. Deriving
`lastContactAt` from an aggregate over interactions would turn one query into a
query per relationship, so it is denormalised.

The price of denormalising is drift, and it is paid in exactly one place.
`lib/brm/record-interaction.ts` is the only module permitted to write the field.
Every create, edit and delete on the interaction log goes through it and
**recomputes the value from scratch inside the same transaction**.

Recomputing rather than comparing is the part that matters. A naive
`if (newDate > lastContactAt)` looks right and is wrong three ways: it leaves the
field stale when the most recent interaction is deleted, when the latest is
downgraded to incidental, and when a backdated entry arrives. All three are
covered in `tests/integration/record-interaction.test.ts`, against a real
database.

**Do not add a second exception without the same treatment.**
