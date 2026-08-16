# ADR-0005 — Next.js, Prisma and SQLite in a single repository

**Status:** Accepted · 17 August 2026

## Context

Greenfield, self-contained, synthetic data, no external systems. Delivered by
undergraduates in one semester, then handed to a client who must be able to run
it. Three shapes were considered.

**A. Full-stack Next.js.** One repository, one command. Server Components read
the database directly, so there is no API layer to keep in step with the UI.

**B. Separate frontend and backend.** Vite + React against Express + Prisma.
Harder boundaries, which suits a split team — at the cost of an API layer to
maintain, two processes to run, and CORS.

**C. No backend at all.** React with IndexedDB. Least operational overhead; no
real database, no persistence worth the name, and nothing to point at when asked
about the shared data model.

## Decision

Option A: Next.js 16 App Router, TypeScript, Prisma 7, SQLite, Tailwind v4.

## Consequences

**Good.** `prisma/schema.prisma` *is* the shared data model — one readable file
that is simultaneously the deliverable and the implementation. No database server
to install: a team member clones and runs three commands. No API layer, so no
class of bug where the frontend and backend disagree about a shape.

**Bad.** SQLite is single-writer, so this cannot serve a concurrent team as-is.
The dev server compiles routes on first visit, which is why the demonstration
guide insists on a production build. Prisma 7 requires a driver adapter and
generates its client as TypeScript, both departures from older tutorials the team
may find online.

**Reversible?** Cheaply, for the database: moving to Postgres is a provider
change, a connection string and a different adapter — the driver-adapter
arrangement already anticipates it. Expensively, for the framework: option B
would mean rewriting every page.
