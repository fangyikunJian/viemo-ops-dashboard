# ADR-0004 — The controlled vocabulary lives in one TypeScript module

**Status:** Accepted · 17 August 2026

## Context

The system has several controlled vocabularies: relationship type and status,
interaction channel, project status, task status and priority, user role. The BRM
taxonomy is itself a graded deliverable, so the definitions have to exist as
prose as well as as values.

SQLite has no native enum type, which forced the question rather than allowing
the default.

## Decision

`lib/domain/enums.ts` is the single source of truth. Each vocabulary is a `const`
array, with a Zod schema and a TypeScript union derived from it, plus a `Term`
object per value carrying its **human label**, its **one-sentence definition**,
and its **badge colour**.

Database columns are `String`, validated on every write.

## Consequences

**Good.** The taxonomy in the type system, the taxonomy shown on hover in the
interface, and the taxonomy in the documentation are one object and cannot
disagree. Adding a relationship type is a single edit that propagates to filters,
forms, badges and lists. The definitions being *in code* means they get reviewed
like code.

**Bad.** The database will accept an invalid string if something bypasses the
application layer — a direct SQL write, or a bug in a code path that skips
validation. A database enum would refuse at the storage layer. Mitigated by every
write going through Zod, and by the read side treating stored values as trusted
rather than re-parsing every row.

**Also good, unexpectedly.** Because the definitions live beside the values, the
BRM taxonomy document could be written *from* the code rather than alongside it,
which removes a whole category of documentation rot.
