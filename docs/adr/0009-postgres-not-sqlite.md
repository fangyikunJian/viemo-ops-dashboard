# ADR-0009 — Postgres, not SQLite

**Status:** Accepted · 18 August 2026
**Supersedes the database half of** [ADR-0005](0005-nextjs-prisma-sqlite.md)

## Context

ADR-0005 chose SQLite, and gave good reasons: the brief specifies a greenfield,
self-contained system on synthetic data, and a file-based database means a team
member clones the repository and runs three commands with no database server to
install.

Two things then happened that the original decision could not have accounted
for.

**The client described their actual stack.** In the requirements meeting Alex
Cross named Vercel, Railway, GitHub, **Supabase** and Claude. Supabase is
Postgres. The reasoning in ADR-0005 was sound against the brief and wrong
against the environment this is meant to live in.

**The team could not share data.** Every developer had their own `dev.db`, so an
interaction logged on one machine was invisible on every other. That is
tolerable for a solo prototype and useless for five people and a client who
wants to look at the same records.

Three options were considered.

**A. Stay on SQLite.** Cheapest today. Keeps the "no database to install"
property. Leaves the team unable to share data and the deployment unable to use
the client's own infrastructure — the problem gets more expensive to fix the
more code depends on it.

**B. Postgres, with Docker for local development.** The conventional answer.
Adds Docker as a prerequisite for five students of mixed technical background,
on a project where the client has already observed that only a few members are
technically proficient.

**C. Postgres, with Prisma's local development server.** `prisma dev` starts a
Postgres-compatible server on a developer's machine with nothing to install and
no Docker.

## Decision

Option C. Postgres everywhere: `prisma dev` locally, a container service in CI,
Supabase or any managed Postgres in deployment.

`npm run db:up` starts the local database. The connection string is the only
thing that differs between the three environments; nothing in the application
knows where the database is.

## Consequences

**Good.** The deployment target matches the client's stack, so "how do we host
this" stops being an open question. The team can share one database. Postgres
brings real concurrency, so the single-writer limitation named in the design
document's *Known limitations* is gone. The local story is still one command and
still needs no Docker.

**Bad.** A database server now has to be running before the application will
start, where before a file was enough. `npm run db:up` has to be in everyone's
muscle memory, and a confusing `ECONNREFUSED` is the new failure mode for
forgetting it.

**Unchanged, deliberately.** The status and type columns stay `String` rather
than becoming native Postgres enums. Postgres could enforce them now, but
[ADR-0004](0004-vocabulary-in-one-typescript-module.md)'s reasoning still holds:
the permitted values, their human definitions and their badge colours live
together in `lib/domain/enums.ts`, and a native enum would move half of that
into a migration and make adding a term a schema change.

### Two things found while doing it

**The local development server is not a real multi-database Postgres.** The
integration tests originally created a database per run. Against `prisma dev`,
`CREATE DATABASE` reports success and the name appears in `pg_database`, but
connecting to it lands back in `template1` — the database name is ignored.
Isolation is now per-schema, which behaves correctly on both that server and a
real Postgres.

**The pg driver adapter takes the schema as an option, not a URL parameter.** A
`?schema=` in the connection string is silently ignored, so `lib/db.ts` reads
`DATABASE_SCHEMA` and passes it to the adapter. Silent is the operative word:
the tests connected, ran, and quietly wrote to `public` — the failure only
surfaced as a foreign-key violation against seed data that should not have been
visible.

## Migration notes

The SQLite migration was deleted and replaced with a fresh Postgres one rather
than being converted. Nothing depended on it: the database holds only synthetic
seed data, regenerated in one command.
