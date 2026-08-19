# Client Alignment

**The Viemo Studio Operations Dashboard** · Project UG-S2-28
Written 18 August 2026, after the first requirements meeting with Alex Cross

The placement brief and the client's stated vision are not the same thing. This
document says exactly where they diverge, what was changed in response, and what
still needs a decision — because a gap nobody names is the kind that surfaces at
the final demonstration.

---

## 1. The short version

The brief describes **a dashboard**. The client described **a digital twin of
himself**.

| | The brief | What Alex described |
|---|---|---|
| What the system does | Shows relationship health beside project status | Captures his workflows and runs them |
| The person's role | Reads a prompt, acts on it | Reviews what the system already did |
| AI | Not mentioned once | Central — orchestration, agents, cost, guardrails |
| Data | Synthetic, connected to nothing | Real workflows, Gmail/Microsoft, a live stack |
| Tech | Team's choice | Already exists: Vercel, Railway, GitHub, Supabase, Claude |

Both are legitimate. The brief is what is assessed; the vision is what the client
wants. **They have to be reconciled explicitly, not averaged silently.**

---

## 2. Where we were already aligned

Worth stating first, because most of the build holds up.

**The two modules on a shared data model.** Alex described the BRM as "a business
relationship management tool" and asked for a PM module that could integrate with
Gmail or Microsoft. That is the shape that was built.

**"Well-built solutions rather than vibe-coded projects."** This was the clearest
quality signal in the meeting, and it is where the work is strongest: 102
automated tests, nine architecture decision records, continuous integration, a
measured accessibility audit, and a test plan that marks 26 of 41 manual cases as
*not yet run* rather than claiming they pass. That last detail matters more than
it looks — it is the difference between a claim and a checkable claim.

**"Agnostic systems that can adapt to different tech environments."** The module
boundary rule and the integration port were built for exactly this.

**Data privacy.** Assessed against the Privacy Act 1988 and the Australian
Privacy Principles, including the parts that are *not* met — see
[compliance-and-standards.md](compliance-and-standards.md).

**Clear documentation.** Fourteen documents, published as a site the team can
maintain by editing markdown.

---

## 3. What was wrong, and has been fixed

### The database was SQLite; the client uses Supabase

Alex named the existing stack: Vercel, Railway, GitHub, Supabase, Claude.
Supabase is Postgres.

[ADR-0005](adr/0005-nextjs-prisma-sqlite.md) chose SQLite for good reasons
against the brief — self-contained, no server to install. Those reasons did not
survive contact with the client's actual environment, and the same choice was
also preventing the team from sharing a database.

**Changed.** The system now runs on Postgres everywhere: `npm run db:up` locally
with nothing to install, a container in CI, Supabase or any managed Postgres in
deployment. See [ADR-0009](adr/0009-postgres-not-sqlite.md).

---

## 4. The gap that remains: AI

### What was said

AI ran through the entire meeting. Claude is already in the stack. There was a
discussion of agent orchestration, of integrating APIs, of the *cost* of running
agents and the need for guardrails and clear instructions. An action item is to
show Alex an agent-orchestration tool. And the framing above all of it was
**"digitally twinning himself"** — capturing his workflows so the system can run
them.

### What exists

Nothing. The system has no AI in it at all.

**This is not an oversight.** The placement brief does not mention AI once, and
it explicitly requires "no connection to any live or confidential systems" —
which rules out the integrations a workflow agent would need. The build followed
the brief.

### Why not simply add it

Three reasons, in order of how much they should count.

**A half-built agent is worse than none.** Alex's own concern in the meeting was
cost and guardrails. An agent without a cost ceiling and a tested set of
instructions is a liability to demonstrate, not an asset.

**It is not in the assessed scope.** The brief's deliverables are the dashboard,
the two modules, the shared data model and the documentation. Time spent on AI is
time not spent on those.

**A digital twin is not a 700-hour project.** It is the direction of a product,
not a semester of work.

### What is proposed instead

Build the **seam**, not the feature — the same treatment the Jira question got in
[ADR-0007](adr/0007-integration-port-not-live-connection.md), which the client's
own "agnostic systems" principle argues for.

A typed `AgentPort` alongside the existing integration port, documenting what a
workflow agent would receive, what it would be allowed to do, and what has to be
settled before it can be built — credentials, a cost ceiling, an approval step,
and which workflows are worth automating first.

That gives an answer at the demonstration that is both honest and strong:

> "The AI orchestration layer has a defined boundary. This is where it plugs in,
> this is the data it would see, and these are the three things that need
> deciding before it is built. We did not ship a half-working agent, because the
> cost and guardrail questions you raised are exactly the ones that make a bad
> one dangerous."

**This is a proposal, not a decision. It needs Alex's agreement.**

---

## 5. Questions for the client

In priority order. The first must be settled before the scope document is due on
**28 August 2026**.

**1. Which are we building this semester — the brief, or the vision?**

> The brief specifies a self-contained system on synthetic data with no live
> connections. What you described needs real workflows and AI. If it is the
> brief, we would build the AI orchestration layer as a documented interface and
> leave the implementation to a later team. Is that acceptable?

**2. Are six relationship types right?** Is there something the studio maintains
that does not fit advisor, investor, delivery partner, institutional, supplier or
customer?

**3. What are the real default cadences per type?** Ours are reasonable guesses,
not observed practice.

**4. Where do you record contact today** — email, memory, a spreadsheet? And
would the team realistically spend twenty seconds logging a conversation after it
happens?

That last one decides whether the product works at all. Every cadence figure
depends on people logging interactions; if logging is a chore, the data rots and
the overdue count becomes a lie. It is the failure mode of every project
management tool that needs discipline to stay accurate.

**5. Should one person be able to hold two relationships** — an advisor who is
also an investor currently needs two records.

---

## 6. What this changes about how we work

**Deploy to Vercel, not to our own server.** The client already uses it, Next.js
deploys there with no configuration, and it pairs with Supabase.

**Treat the brief as the floor and the vision as the direction.** Every
architectural decision should leave the vision reachable without being paid for
now. The module boundary, the integration port and the proposed agent port are
all this principle.

**Keep the "not yet done" lists honest.** The strongest thing in the meeting's
favour was Alex's dislike of vibe-coded work. Saying "the core is complete, and
here is what is not" survives scrutiny in a way that "it is finished" does not.
