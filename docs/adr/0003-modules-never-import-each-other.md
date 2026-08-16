# ADR-0003 — The BRM and PM modules never import each other

**Status:** Accepted · 17 August 2026

## Context

The brief allocates five workstreams to five or six students working in
parallel, two of which are the BRM module and the PM module. It also asks the
dashboard to present relationship health beside project status, which requires
data from both.

The obvious approach — let each module import from the other where convenient —
makes every change in one a potential break in the other. In a semester-long
project with two groups editing simultaneously, that becomes a merge problem
first and a correctness problem shortly after.

## Decision

`lib/brm` and `lib/pm` never import each other. They are connected only through
`prisma/schema.prisma`. Anything needing both lives in `lib/dashboard`.

The modules meet at exactly two seams, both **nullable** foreign keys:
`Project.relationshipId` and `Interaction.projectId`.

## Consequences

**Good.** Each group owns a directory and rarely touches another's. Either module
can be built, tested and demonstrated with the other absent, so integration is
not a cliff at the end of the semester. The rule is mechanically checkable — an
import across the boundary is visible in review.

**Bad.** Some queries are written twice in similar shapes. A genuinely shared
helper has to be promoted to `lib/domain` or `lib/dashboard`, which is a
deliberate step rather than a convenient import.

**Nullable is load-bearing.** If either seam were required, neither module could
be demonstrated alone and the parallelism would collapse. A future change tempted
to make one mandatory should read this record first.

**Not enforced by tooling.** An ESLint boundary rule would make it mechanical;
today it rests on review and on this record.
