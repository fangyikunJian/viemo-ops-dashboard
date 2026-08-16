# ADR-0007 — Integration is a port with adapters, not a live connection

**Status:** Accepted · 17 August 2026

## Context

The brief asks integration to include "a lightweight, stubbed interface for
future extensions". Separately, the question was raised whether the project
should be built on Jira's API, since the PM module is superficially Jira-shaped.

Three responses were possible: build a live Jira integration; build nothing and
mention extensibility in the documentation; or build the boundary.

## Decision

A typed port, `lib/integration/types.ts`, with adapters registered behind it. Two
ship: a **real** JSON export driving `/api/export`, and a **documented,
deliberately unimplemented** Jira stub.

## Consequences

**Why not the live Jira integration.** Three obstacles, in increasing order of
seriousness. Credentials need a secret store the application does not have. A
conflict policy — which side wins when a task changes in both — is a client
decision, not a technical one. And the field mapping loses something that
matters: **Jira has no relationship, no cadence, no bidirectional value**, so the
BRM half of this product has nowhere to live inside it. Building on an external
product's API would also delete the shared data model, which the brief names as a
deliverable in its own right.

**Why a working adapter as well as a stub.** An interface nobody has ever run
something through is a guess about a boundary. Shipping the JSON export means the
seam has been exercised end to end — a route builds a snapshot and hands it to a
registered adapter, and swapping the adapter changes where data goes without
touching the route.

**Good.** A future team writes an adapter and registers it; nothing in either
module or the schema changes. The stub compiles, so it documents the required
shape in a form that cannot go stale.

**Bad.** It is speculative generality — a port with two adapters, one of which
does nothing. Justified here only because the brief asks for it explicitly. It
would be over-engineering otherwise.

**Honest failure.** The stub declares `implemented: false` and returns an error
explaining what is missing, rather than silently succeeding. A test asserts that
no adapter declares a capability it has no method for.
