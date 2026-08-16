# ADR-0006 — Authorisation is enforced inside server actions

**Status:** Accepted · 17 August 2026

## Context

The brief lists role-differentiated views as a **stretch** item. The client team
asked for full role-based access control in the core instead, which meant
building it without letting it consume the time budgeted for the two modules.

Access control can be enforced in the interface, at the route, or at the action.
Only one of those is a boundary.

## Decision

Three layers, with an explicit hierarchy:

1. The interface hides controls a role cannot use — a **courtesy**, so people are
   not shown doors they cannot open.
2. Route guards redirect a user away from a page they may not read — **defence in
   depth**.
3. Every server action that writes calls `can()` before reading the form — **the
   boundary**.

The policy itself is `lib/auth/permissions.ts`: a pure function over a small
table, importing nothing but a type.

## Consequences

**Good.** A user who can construct a POST cannot reach anything their role
forbids, regardless of what the interface showed them. The policy fits on one
screen and is tested without a database — 12 tests covering every role against
every action. `lib/brm` and `lib/pm` contain no permission logic at all, so the
whole layer can be tightened, replaced or removed without touching either module.
The admin screen renders the matrix *from the same function*, so the
documentation cannot drift from the behaviour.

**Bad.** The check is repeated at the top of every action, which is duplication a
middleware layer would remove — at the cost of making the boundary invisible at
the point it matters. The repetition was judged worth it: an omitted line is
visible in review, a misconfigured middleware is not.

**An unrecognised role fails closed.** Tested explicitly, because a default-open
authorisation bug is the kind that survives to production.

**Scope note.** Because this was pulled forward from the stretch tier, it was
built as an isolated layer. If the semester runs short, deleting `lib/auth/` and
the `can()` calls removes it without disturbing the delivered core.
