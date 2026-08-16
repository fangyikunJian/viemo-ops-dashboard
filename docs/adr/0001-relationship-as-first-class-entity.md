# ADR-0001 — Relationship is a first-class entity

**Status:** Accepted · 17 August 2026

## Context

The brief asks for a Business Relationship Management module modelling "the full
spectrum of a venture's business relationships (advisors, investors, delivery and
institutional partners, suppliers)". The data model has to hold both a
multinational university and an independent advisor who consults from a kitchen
table.

Three shapes were considered.

**A. Organisation-centric.** `Organisation` is the subject; people hang off it.
Familiar, and how most CRMs work. But an independent advisor is not an
organisation, so every individual relationship needs a fabricated single-person
company. It is also, structurally, exactly a CRM — which makes it hard to argue
in a design document that this is something else.

**B. Relationship-first.** `Relationship` is the subject, carrying type, status,
cadence and owner directly. `Contact` and `Interaction` hang off it.
`Organisation` becomes an optional grouping.

**C. Party model.** An abstract `Party` resolving to Person or Organisation, with
relationships as typed edges. The most flexible: one human can hold several
relationships, and people can belong to organisations independently of them.

## Decision

Option B. `Relationship` is the first-class entity, with `organisationId`
nullable.

The deciding argument was that option B's schema reads as the brief's own
sentence — *who each relationship is, its type and status, the interaction
history, and the cadence at which it should be maintained* — with no
translation. Option C models reality more completely, but the extra indirection
costs a join on every query and a layer of explanation on every screen, in a
project of roughly 700 hours delivered by undergraduates.

## Consequences

**Good.** An independent advisor is a natural record, not a workaround.
Relationship-level concepts — cadence, owner, bidirectional value — sit on the
entity that owns them. Queries are one level deep. The BRM-versus-CRM argument is
visible in the schema, which matters because that argument is a graded
deliverable.

**Bad.** A person who is both an advisor and an investor needs two records, and
nothing in the system knows they are the same human. This is the real cost, and
it is listed as an open question for the client in the taxonomy document.

**Reversible?** Partly. Moving to option C later means a migration and touching
every BRM query, but the two module seams and the PM module would be unaffected.
