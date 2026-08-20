# Product Specification

**The Viemo Studio Operations Dashboard** · Project UG-S2-28
Version 1.0 · 20 August 2026

What the product does, and by what rules. Written to be read by the client and
argued with — every rule below is a decision someone made, and any of them can
be wrong.

Where a rule is a guess rather than a requirement, it says so. Those are the
ones to push back on.

---

## 1. The problem

A venture studio's success rests on two things that are normally tracked in
different tools by different people: the relationships it maintains, and the
project work it delivers.

The relationships are the harder half. A CRM assumes a customer moving along a
funnel toward a sale, and most of the relationships that decide whether a studio
succeeds are never going to buy anything — advisors, investors, institutional
partners. They do not "close". They lapse, quietly, and nothing tells you.

**The product exists to notice that lapse before it costs something.**

---

## 2. What it does, in one page

| | |
|---|---|
| **Records** | Every business relationship: who it is, what type, what state, who owns it, what each side gets from it |
| **Tracks** | Every meaningful contact, and how long it has been since the last one |
| **Compares** | That gap against the rhythm the team agreed for that particular relationship |
| **Surfaces** | The relationships that have slipped past their rhythm, worst first |
| **Alongside** | The project work being delivered for those relationships, and what is at risk |
| **Controls** | Who can see and change what, enforced on the server |
| **Records** | Who changed what, and when, in an append-only trail |

It does **not** send anything, connect to anything, or decide anything on its
own. Every figure it shows is derived from something a person entered.

---

## 3. The relationship model

### 3.1 What a relationship is

One record per relationship the studio maintains. The subject is the
relationship itself, not a company and not a deal.

| Field | Required | Notes |
|---|---|---|
| Name | Yes | A person or an entity — whichever the relationship actually is |
| Type | Yes | One of six, §3.2 |
| Status | Yes | One of four, §3.3 |
| Owner | Yes | Exactly one team member. A relationship everyone owns is one nobody maintains |
| Cadence | No | Days between contacts. Blank is a valid, meaningful choice — §4.2 |
| What they give us | No | |
| What we give them | No | The field teams skip, and the one that predicts survival |
| Organisation | No | Optional grouping. An independent advisor has none, and that is normal |
| Tags | No | Shared with projects |
| Notes | No | |

**An independent advisor needs no organisation.** This is the difference from a
CRM that most affects daily use: no placeholder company has to be invented for
a person who is simply a person.

### 3.2 The six types

Organised by **what the relationship is for**, not by what it earns.

| Type | Definition |
|---|---|
| **Advisor** | Provides judgement, expertise or introductions. Usually informal, usually unpaid |
| **Investor** | Has invested, or is a credible prospect. Includes existing investors, whom a CRM would treat as closed and stop tracking |
| **Delivery partner** | Builds or ships alongside the studio. Work flows both directions |
| **Institutional** | Universities, government bodies, accelerators. Slow, high-leverage, maintained by presence |
| **Supplier** | Provides goods or services the studio pays for |
| **Customer** | Pays the studio. **One type of six**, not the organising assumption |

> **Open question for the client.** Is there a relationship the studio maintains
> that does not fit these six — a portfolio founder, a mentor to a venture
> rather than to the studio? Adding a type is cheap now and expensive later.

### 3.3 The four states

A **cycle**, not a funnel. Nothing in the system treats a later state as better
than an earlier one, and a relationship can move in either direction for years.

| State | Meaning | Cadence tracked? |
|---|---|---|
| **Prospective** | Worth building, not yet established | Yes |
| **Active** | Live and two-way | Yes |
| **Dormant** | Real, valuable, deliberately quiet | **No** |
| **Archived** | No longer maintained; history kept | **No** |

**Dormant is the load-bearing state.** It is how the system distinguishes a
relationship you chose to rest from one you are neglecting. Without it, the only
honest way to record "we agreed to pick this up after their parental leave"
would be to let it show as overdue for six months — at which point the overdue
count stops meaning anything and people stop reading it.

### 3.4 Contacts

People to speak to within a relationship. A relationship that is itself an
individual usually has one; an institutional partner may have several. At most
one can be marked primary — setting a new primary demotes the previous one
automatically.

---

## 4. Contact cadence

The mechanism the whole product is built around.

### 4.1 What is recorded

Each contact is logged as an **interaction**: when it happened, through what
channel (meeting, call, email, event, message), a summary, optionally the
project it was about, and one flag.

### 4.2 The flag that matters

Every interaction is either **substantive** or **incidental**.

- **Substantive** — a real conversation. Resets the contact clock.
- **Incidental** — a forwarded link, a one-line reply, a calendar
  acknowledgement. Recorded in the history; does **not** reset the clock.

This distinction is small in the system and large in what it means. If
forwarding an article counted as maintaining a relationship, every cadence
figure in the product would be a lie that took thirty seconds to tell.

Either can be changed after the fact; the cadence recalculates immediately.

> **Open question for the client.** Would the team use this flag honestly? If
> not, the cadence figure loses its meaning and the flag should be removed
> rather than quietly ignored.

### 4.3 The calculation

```
clock starts at    last substantive interaction, or the date the
                   relationship was added if there has never been one
falls due at       clock start + cadence days
warning window     one fifth of the cadence, minimum 1 day, maximum 30
```

| Result | When |
|---|---|
| **Not tracked** | No cadence set, or state is Dormant or Archived |
| **On track** | Contacted within the rhythm |
| **Due soon** | Inside the warning window |
| **Overdue** | Past due |

**Overdue is the number the product exists to keep at zero.**

Three decisions inside this worth arguing with:

**A relationship with no cadence is *not tracked*, not overdue.** Collapsing
those two would make the overdue count meaningless — the number would include
relationships nobody ever intended to schedule.

**A relationship never contacted counts from the day it was added.** Adding it
is what creates the obligation to make first contact, so a new prospect gets one
full window before it is chased — and it still cannot silently disappear.

**The warning window is capped at 30 days.** A fifth of a year is 73 days, which
would leave an annual relationship flagged as needing attention for a fifth of
its life. A warning that is always on carries no information.

> **Open question for the client.** The default cadences offered — weekly,
> fortnightly, monthly, quarterly, twice a year, annually — are reasonable
> guesses, not observed practice. What are the real rhythms per type?

---

## 5. Project work

### 5.1 What a project is

| Field | Required |
|---|---|
| Name | Yes |
| Status | Yes — Planning, Active, On hold, Done, Cancelled |
| Lead | Yes — one team member |
| Description, start date, due date, tags | No |
| **Relationship** | No — who the work is for |

That last field is the join between the two halves of the product. It is
optional because internal work has no counterpart.

### 5.2 Tasks

Title, status (To do, In progress, Blocked, Done), priority, optional assignee
and due date. Moved between states from the board in one click.

**Completion time is set by the system**, never entered, so it cannot disagree
with the status it records.

### 5.3 Progress and risk — both derived

**Progress** is tasks done ÷ total tasks. Never typed in, so it cannot go stale.

**Overdue** and **at risk** are deliberately different things:

| | Meaning | Applies to |
|---|---|---|
| **Overdue** | Past its due date. A fact | Planning, Active, On hold |
| **At risk** | Needs someone to act. A judgement | Planning, Active **only** |

A project is at risk when it is overdue **or** has a blocked task. Every reason
is listed, not just the first.

**A project on hold is never flagged at risk, even when overdue.** Pausing it was
a decision the team already took and recorded; reporting it back as a risk asks
them to act on their own choice and buries the projects that genuinely need
attention.

---

## 6. The dashboard

Reading order is decision order: *what is wrong* → *how much* → *which ones* →
*context*.

1. **A sentence.** "5 relationships need contact." At a size readable from two
   metres — someone should know whether today needs them before they sit down.
2. **Four figures.** Overdue, due soon, projects at risk, projects in flight.
   Each links to the filtered list behind it.
3. **Needs contact.** Overdue first, then due soon; worst first within each.
4. **Projects at risk**, with the reason and progress.
5. **Next due** and **recent contact**.

Every filtered view lives in the address bar, so it can be bookmarked or sent to
a colleague.

---

## 7. Who can do what

Three roles. Enforced on the server inside every action that changes data —
hiding a button is a courtesy, not a control.

| | Viewer | Member | Admin |
|---|:--:|:--:|:--:|
| Read the dashboard and both modules | ● | ● | ● |
| Create and edit records | | ● | ● |
| Log interactions | | ● | ● |
| Archive | | ● | ● |
| Delete permanently | | | ● |
| Manage accounts | | | ● |
| Export | | | ● |
| See the audit trail | | | ● |

**The line between archive and delete is the interesting one.** Archiving is
reversible and keeps the interaction history that explains why a relationship
went the way it did. Deleting destroys it. Members archive; only administrators
delete.

Two things the system refuses regardless of role: an administrator cannot demote
or deactivate themselves out of being the last active administrator, and
deactivating an account ends its live sessions immediately rather than waiting
for the cookie to expire.

**Viewer exists for a specific reason** — so an advisor or an observer can be
given visibility without edit rights.

---

## 8. The audit trail

Append-only. Nothing in the product edits or deletes an entry.

Records creation, edits (with the fields that changed and their before and after
values), archiving, deletion, sign-ins, failed sign-ins, role changes, account
deactivation and exports.

Two properties worth knowing:

**Entries survive deletion.** The person's name and the record's title are copied
into each entry rather than looked up later, so an entry does not go blank when
the account or the record is removed — which is exactly when someone needs to
read it.

**A failed sign-in is recorded without naming whether the account exists.** The
sign-in screen deliberately gives the same message for a wrong password and an
unknown address; the audit trail must not undo that.

---

## 9. Deliberate limits

Things the product does not do, and why. Each is a decision, not an oversight.

| Not built | Why |
|---|---|
| Notifications or email digests | The dashboard is the notification for now. A digest is the highest-value next addition and needs a client decision on frequency |
| Relationship-health scoring beyond cadence | The data is recorded; the formula is missing, and it should be **agreed rather than invented**. A score nobody believes is worse than no score |
| Analytics over time | Needs history that does not exist yet. Meaningful after a few months of real use |
| Any AI or automation | See §10 |
| Calendar or email integration | Requires access to live accounts, which this version's scope rules out |
| File attachments | Storage, scanning and retention are a project of their own |
| Multi-tenancy | One studio |

---

## 10. On automation

The client's stated ambition is a system that captures his workflows and runs
them. This version does not, and the reasoning belongs in a specification rather
than a corridor conversation.

**What exists:** a defined boundary an automation layer plugs into. It specifies
that an automated agent may only ever **propose** — every method returns
proposals, there is no path from the interface to a change. A proposal becomes a
change when a person approves it, through the same permission checks as any
other edit. It also requires every run to report what it cost, and to stop at a
spending ceiling set before it starts.

**What does not exist:** any automation behind that boundary.

**Why:** three questions have no answers yet. Where credentials would live; what
a run actually costs; and who approves a proposal, how quickly. The third is a
workflow decision for the client, not a technical one — and a proposal nobody
reviews is either ignored or, worse, trusted.

A working baseline is included that uses the cadence and health rules alone, no
model and no cost. Anything more sophisticated should be measurably better than
it before it is paid for.

---

## 11. Data and privacy

Everything in the delivered system is **synthetic**. No real relationship,
contact or project data, and no connection to any live system.

When it does hold real data:

- It collects only what a contact record needs — name, role, email, phone
- Nothing is sent anywhere. No analytics, no telemetry, no third-party calls
- Passwords are hashed, never stored or recoverable
- Sign-in is rate-limited against guessing
- Every change is attributable through the audit trail

**One thing needs a client decision before real data is entered.** The people
recorded in a relationship-management system are third parties who never use it
and have not been told they are in it. Under the Australian Privacy Principles
that notification is a live question. It is a business-process decision, not a
feature — most organisations handle it with a privacy policy and a line at first
contact. The full assessment is in
[compliance-and-standards.md](compliance-and-standards.md).

---

## 12. What we need decided

In priority order. The first is the one that blocks everything else.

1. **Is this semester's target this specification, or the automated version?**
   They are different products and the difference is not a matter of degree.
2. **Are six relationship types right?**
3. **What are the real default cadences per type?**
4. **Where is contact recorded today, and would the team spend twenty seconds
   logging a conversation after it happens?** This decides whether the product
   works at all — every figure in it depends on people actually logging.
5. **Should one person be able to hold two relationships** — an advisor who is
   also an investor currently needs two records.
