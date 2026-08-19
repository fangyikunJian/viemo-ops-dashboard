# Architecture Decision Records

Each file records one decision that was expensive to make and would be
expensive to reverse — the forces at play, what was chosen, and what it cost.

Format is [Michael Nygard's](https://github.com/architecture-decision-record/architecture-decision-record):
**Context**, **Decision**, **Status**, **Consequences**. The design document
explains how the system works; these explain *why it is that way and not
another way*, which is the part that gets lost when people leave a project.

## Writing a new one

Copy the shape of an existing file. Number it sequentially. Record the decision
when it is made, not afterwards — the value is in capturing the options that
were rejected while you still remember why.

A decision is worth an ADR if reversing it would mean changing several files,
or if someone six months from now would reasonably ask "why on earth is it done
like this?".

Never edit a decision once accepted. Supersede it with a new record and mark the
old one **Superseded by ADR-NNNN**, so the reasoning trail survives.

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-relationship-as-first-class-entity.md) | Relationship is a first-class entity, not an attribute of an organisation | Accepted |
| [0002](0002-derive-values-rather-than-store-them.md) | Derive cadence, progress and risk rather than storing them | Accepted |
| [0003](0003-modules-never-import-each-other.md) | The BRM and PM modules never import each other | Accepted |
| [0004](0004-vocabulary-in-one-typescript-module.md) | The controlled vocabulary lives in one TypeScript module, not database enums | Accepted |
| [0005](0005-nextjs-prisma-sqlite.md) | Next.js, Prisma and SQLite in a single repository | Accepted |
| [0006](0006-authorise-inside-server-actions.md) | Authorisation is enforced inside server actions | Accepted |
| [0007](0007-integration-port-not-live-connection.md) | Integration is a port with adapters, not a live connection | Accepted |
| [0008](0008-step-palette-colours-for-contrast.md) | Step the reference palette's colours for text contrast | Accepted |
| [0009](0009-postgres-not-sqlite.md) | Postgres, not SQLite — matching the client's Supabase stack | Accepted |
