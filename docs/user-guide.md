# User Guide

**The Viemo Studio Operations Dashboard**

This guide covers what each screen is for and how to use it. For why the system
is built the way it is, see [design-and-architecture.md](design-and-architecture.md);
for the meaning of each term, see [brm-taxonomy.md](brm-taxonomy.md).

---

## Signing in

Go to the address the dashboard is running at and sign in with your email and
password. Sessions last seven days.

If you are seeing the demonstration build, three accounts are listed on the
sign-in screen, one per role, so you can see what each role sees.

### The three roles

| Role | What you can do |
|---|---|
| **Viewer** | Read the dashboard, all relationships and all projects. Change nothing. |
| **Member** | Everything a Viewer can do, plus create and edit relationships, contacts, interactions, projects and tasks, and archive records. |
| **Admin** | Everything, plus permanent deletion and managing accounts. |

If a button you expect is missing, your role does not have that permission. Ask
an administrator.

---

## The dashboard

The home screen. It answers one question: *what needs attention today?*

### The four numbers

| Tile | What it counts |
|---|---|
| **Relationships overdue** | Past the contact rhythm the team agreed. **The number this dashboard exists to keep at zero.** |
| **Due soon** | Inside the last fifth of their cadence window — reach out before they lapse |
| **Projects at risk** | Overdue, or held up by a blocked task |
| **Projects in flight** | Planning, active or on hold |

Each tile is a link to the filtered list behind it.

### Below the tiles

- **Relationships needing attention** — the overdue and due-soon list, worst
  first
- **Relationships by type** — the shape of the studio's network
- **Projects at risk** — with the reason and the progress bar
- **Projects by status**
- **Next due** — the open tasks with the nearest deadlines
- **Recent contact** — the latest touchpoints logged

---

## Relationships

### Finding one

The list is ordered by urgency: overdue first, then due soon, then everything
else, alphabetically within each band.

**Filter chips** across the top narrow by cadence, type and status. Clicking a
chip you have already selected clears it. Filters appear in the address bar, so
a filtered view can be bookmarked or pasted to a colleague.

**Search** matches part of a name.

### Reading a relationship

The header carries the type, the lifecycle status, the cadence badge and any
tags. Below that:

- **Interaction history** — every touchpoint, newest first
- **Contact rhythm** — the agreed cadence, when contact last happened, when it
  next falls due, and who owns it
- **Value, both ways** — what they give the studio, and what the studio gives
  them
- **People** — the individuals to speak to
- **Project work** — projects being delivered for or with this relationship
- **Notes**

### Logging an interaction

The most common thing you will do. On the relationship page:

1. Set **when** it happened (defaults to today; cannot be in the future)
2. Choose the **channel**
3. Write **what happened**
4. Optionally link it to a **project**
5. Leave **"This resets the contact clock"** ticked for a real conversation

**That last checkbox matters.** Tick it for a conversation. Untick it for a
forwarded link or a one-line reply — those are recorded in the history but do
not reset the cadence clock.

If everything counted, "on track" would stop meaning anything. The distinction
is what makes the overdue number worth reading.

You can change your mind afterwards: **Mark incidental** / **Mark substantive**
on any interaction recalculates the cadence immediately.

### Creating and editing

**New relationship** on the list page. The name is a person or an entity —
whichever the relationship actually is. An independent advisor needs no
organisation.

**Setting a cadence.** Pick a preset, or switch to a custom number of days.
Leaving it as **Not tracked** is a legitimate choice for a relationship that
should not be on a rhythm at all — a purely transactional supplier, for
instance. Not tracked is not the same as overdue, and the dashboard treats them
differently.

**Value, both ways.** Fill in both. The second — what the studio gives them — is
the field people skip, and it is the one that predicts whether the relationship
survives.

### Archiving versus deleting

**Archive** (Members and Admins) sets the status to Archived. The relationship
drops out of cadence tracking but keeps every interaction. Reversible.

**Delete** (Admins only) removes the relationship, its contacts and its
interactions permanently. It destroys the history that explains why the
relationship went the way it did.

Archive unless you are certain.

---

## Projects

### The list

Cards, soonest due first. Filter by **At risk**, **In flight**, or status. Each
card shows progress, lead, due date, the relationship it is for, and any risk.

### The project page

A summary strip — progress, due date, lead, and the relationship it is being
delivered for — above a four-column task board.

**Tasks** move between **To do**, **In progress**, **Blocked** and **Done**. Each
task card carries the buttons to move it; one click sends it to another column
and progress recalculates.

**Blocked matters.** A blocked task puts its project at risk on the dashboard.
Use it for work that genuinely cannot proceed, not for work that is merely slow
— otherwise the at-risk count fills up and stops being useful.

At the bottom, **Conversations about this project** shows interactions logged
against a relationship and tagged to this project — the same link seen from the
other side.

### Creating and editing

**New project** on the list page. Name, description, status, lead and dates.

**Who it is for** links the project to a relationship. Optional — internal work
has no counterpart — but linking it is what lets the dashboard show relationship
health and project status as one picture.

A due date before the start date is rejected.

### What "at risk" means

A project is at risk when it is **overdue** or has a **blocked task**, and only
while it is Planning or Active.

A project **on hold** is never flagged at risk, even if overdue. Pausing it was a
decision the team already made and recorded; reporting it back as a risk would
ask them to act on their own choice and would bury the projects that need
attention.

---

## Administration

Administrators only.

### Accounts

Create an account with a name, email, password and role. **Acts as** links the
account to a person in the studio — needed before that account can log
interactions, because an interaction is attributed to a person.

Change a role with the dropdown and **Set**. **Deactivate** blocks sign-in and
ends any live session immediately.

Two things the system will not let you do, however you try: demote yourself when
you are the only active administrator, or deactivate your own account. Both
would lock everyone out.

### The permission matrix

The bottom of the page shows exactly which role can take which action on which
kind of record. It is generated from the same code that enforces the rules, so
it cannot describe something the system does not actually do.

### Integrations

**Administration → Integrations** lists the adapters this system can send data
through.

- **JSON export** — works now. **Export now** downloads every project and
  relationship as a single JSON file.
- **Jira** — a documented stub, not built. The page explains what would have to
  be settled first.

---

## Things worth knowing

**Cadence is per relationship.** A fortnightly customer and a twice-yearly
advisor are both healthy. The system measures each against its own rhythm, never
a shared rule.

**Dormant is a real state.** If a relationship should go quiet for a while — a
contact on leave, a client waiting on a budget cycle — set it to **Dormant**
rather than letting it run overdue. Dormant relationships are not chased, and
the reason belongs in the notes.

**Nothing is ever "won".** Relationship status is a cycle, not a funnel. Moving
from Active to Dormant and back again over years is normal, and neither
direction is a failure.

**Filters live in the address bar.** Any filtered view can be bookmarked or sent
to someone else.

**Hover a badge** to see the definition of the term it shows.

---

## If something looks wrong

| Symptom | Likely cause |
|---|---|
| A relationship shows **Not tracked** when you expected a status | No cadence is set, or its status is Dormant or Archived |
| A relationship still shows **Overdue** after you logged contact | The interaction was marked incidental, or dated further back than the last substantive one |
| A project shows **At risk** with no overdue date | It has a blocked task |
| A paused project is overdue but not at risk | Working as intended — see *What "at risk" means* |
| A button you expect is missing | Your role does not have that permission |
| You cannot log an interaction | Your account is not linked to a team member. An administrator can link it under **Acts as** |
