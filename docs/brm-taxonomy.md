# The BRM Taxonomy

**The Viemo Studio Operations Dashboard** · Project UG-S2-28

This document defines every term the Business Relationship Management module
uses, and explains how the model differs from a conventional CRM.

Every definition here corresponds to an entry in `lib/domain/enums.ts`, which is
what the application reads its labels and hover definitions from. The document
and the running system cannot disagree, because they are the same source.

---

## 1. Why a new vocabulary was needed

A CRM has one implicit relationship type — the customer — at some point along a
sales funnel. That is a good model of a sales organisation and a poor model of a
venture studio, where the people who most determine whether the studio succeeds
are frequently not paying it anything.

An advisor who takes a call twice a year and makes one introduction may be worth
more than a customer. A CRM has nowhere to put that advisor except as a contact
attached to a deal that will never close, in a stage that will never advance.
Within a few months they stop being tracked at all.

So the vocabulary below is organised around a different question. Not *how close
is this to a sale?* but *what is this relationship for, and are we maintaining
it?*

---

## 2. Relationship types

Six types, covering the full spectrum of a venture's business relationships.
They are about **what the relationship is for**, not how much revenue it
produces.

### Advisor

Provides judgement, expertise or introductions, usually informally and usually
unpaid. The value received is counsel; the value returned is typically
visibility, equity or reciprocity.

*Why it is separate:* an advisor has no transaction to hang a record on. In a
CRM they are invisible. Here they are a first-class relationship with a cadence,
which is the only thing that keeps them from quietly lapsing.

### Investor

Has invested, or is a credible prospect to invest, in the studio or a venture
within it.

*Why it is separate:* it deliberately includes **existing** investors, whom a CRM
would consider closed and stop tracking. An investor relationship arguably
begins at the close rather than ending there.

### Delivery partner

Builds or ships alongside the studio — agencies, contractors, technical
collaborators. Peer-to-peer, with work flowing in both directions.

*Why it is separate:* neither "customer" nor "supplier" fits a relationship where
you are sometimes each other's client.

### Institutional

Universities, government bodies, accelerators, industry associations.
Slow-moving, high-leverage, maintained through consistent presence rather than
transactions.

*Why it is separate:* the payoff horizon is measured in years, and the failure
mode is silence rather than rejection. Cadence is the whole mechanism.

### Supplier

Provides goods or services the studio pays for.

*Why it is separate:* tracked so that dependencies and renewal conversations are
visible — not to manage a purchasing pipeline.

### Customer

Pays the studio for work or product.

*Why it is separate:* it is deliberately **one type of six**, rather than the
organising assumption of the whole system. That single framing choice is most of
what makes this a BRM.

---

## 3. Relationship status

Four states. **This is a lifecycle, not a funnel** — the most important
structural difference from a CRM.

Pipeline stages are ordered and terminal: a deal advances toward Won or Lost and
then leaves the board. These four states form a cycle. A relationship may move
from Active to Dormant and back again several times over years, and neither
direction is a failure. Nothing in the application treats a later status as
better than an earlier one.

| Status | Definition |
|---|---|
| **Prospective** | Identified as worth building, but not yet established. Contact has been limited or one-directional. |
| **Active** | A live, two-way relationship being maintained to an agreed cadence. |
| **Dormant** | Real and valuable, but intentionally quiet. |
| **Archived** | No longer maintained. Retained for history so past context is not lost if the relationship is later revived. |

### Dormant is the load-bearing one

Dormant is a legitimate resting state, not a lapsed one. It is how the model
distinguishes **a relationship you have chosen to rest** from **one you are
neglecting**.

Without it there is no honest way to record "we agreed to pick this up after
their parental leave" other than letting the relationship show as overdue for
six months — at which point the overdue count stops meaning anything and people
stop reading it.

Dormant and Archived relationships are not cadence-tracked.

---

## 4. Contact cadence

The heart of the module.

**Cadence** is the agreed contact rhythm for a relationship, in days. It is set
per relationship, because a fortnightly customer and a twice-yearly advisor are
both healthy at very different frequencies. It may also be left unset, which is
a deliberate choice and reads differently from being overdue.

Presets offered: weekly (7), fortnightly (14), monthly (30), quarterly (90),
twice a year (182), annually (365). Any number of days may be entered.

### Cadence status

Derived, never stored. Computed by `lib/brm/cadence.ts`.

| Status | Meaning |
|---|---|
| **Not tracked** | No cadence agreed, or the relationship is Dormant or Archived. Deliberately different from overdue. |
| **On track** | Contacted within the agreed rhythm. |
| **Due soon** | Inside the final fifth of the cadence window — time to reach out before it lapses. |
| **Overdue** | The agreed rhythm has been missed. |

**Overdue is the single number the dashboard exists to keep at zero.**

The "due soon" window is a fifth of the cadence, never less than a day and never
more than 30. The cap matters: a fifth of a year is 73 days, and a relationship
flagged as needing attention for a fifth of its life is a warning nobody reads.

### The clock

For a relationship that has been contacted, the clock runs from the most recent
**substantive** interaction. For one never contacted, it runs from the day the
relationship was added — adding it is what creates the obligation to make first
contact, so a new prospect gets its full first window before being chased, and
still cannot silently disappear.

---

## 5. Interactions

A logged touchpoint against a relationship.

| Channel | Meaning |
|---|---|
| **Meeting** | In person or video, scheduled and two-way |
| **Call** | A voice conversation, scheduled or not |
| **Email** | Written correspondence |
| **Event** | Contact made at a conference, demo night or similar |
| **Message** | Short-form: SMS, LinkedIn, Slack, WhatsApp |

### Substantive versus incidental

Every interaction carries a flag: does this reset the contact clock?

**Substantive** — a real conversation. Resets the clock.
**Incidental** — a forwarded link, a one-line reply, a calendar acknowledgement.
Recorded in the history, but does not reset the clock.

This distinction is small in the schema and large in what the system means
without it. If forwarding an article counted as maintaining a relationship,
every cadence figure in the application would be a lie that took thirty seconds
to tell. The flag is what makes "on track" a claim worth believing.

---

## 6. Bidirectional value

Two fields, deliberately not one:

- **What they give us** — the counsel, capital, capacity or custom received
- **What we give them** — deal flow, visibility, work, referrals, equity

A CRM records a deal size, which is a single number flowing one way.

The second field is the one teams forget, and it is the one that predicts
whether the relationship survives. A relationship where you cannot articulate
what the other side gets is not a relationship; it is a series of requests, and
it has a limited number of uses left.

---

## 7. Supporting entities

**Contact** — a person to speak to within a relationship. A relationship that is
itself an individual usually has one; an institutional partner may have several,
one of which is marked primary.

**Organisation** — an *optional* grouping for relationships under the same legal
entity. Optional is the point: an independent advisor is a relationship with no
organisation, and the model does not require inventing a placeholder company for
them.

**Owner** — the team member responsible for maintaining the relationship. Every
relationship has exactly one, because a relationship everyone owns is one nobody
maintains.

**Tag** — free-form labels, shared with the PM module so the same word means the
same thing in both.

---

## 8. Summary of differences

| | CRM | This BRM |
|---|---|---|
| Organising unit | Deal | Relationship |
| Status | Pipeline stage, terminal | Lifecycle, cyclical |
| Health measure | Time to close | Time since substantive contact vs. agreed cadence |
| Value | One direction, a number | Two directions, described |
| Types | Customer, implicitly | Six, of which customer is one |
| Resting state | Doesn't exist — closed or gone | Dormant, first-class |
| No-contact state | Overdue | Not tracked, distinct from overdue |
| What ends a record | Won or lost | Nothing; archived records keep their history |

---

## 9. Open questions for the client

Written before the requirements meeting. These are where the taxonomy is most
likely to need changing, and changing them is cheap now.

1. **Are six types right?** Is there a relationship the studio maintains that
   does not fit — a portfolio founder, perhaps, or a mentor to a venture rather
   than to the studio?
2. **Should one party be able to hold two relationships?** Someone who is both an
   advisor and an investor currently needs two records. Simple, and possibly
   wrong.
3. **What are the real default cadences per type?** The presets are reasonable
   guesses, not observed practice.
4. **Who owns a relationship in practice** — one person, or a primary and a
   backup?
5. **Is "substantive" the right line**, and would the team actually use the flag
   honestly? If not, the cadence figure loses its meaning and the flag should go.
