# Demonstration Guide

**The Viemo Studio Operations Dashboard** · Project UG-S2-28

A script for demonstrating the system — to the client, to the supervisor, or in
the final presentation. Follow it as written the first time; adapt once you have
run it twice.

---

## Part 1 — Before the room

### 1.1 Thirty minutes before

Run these in order and watch each one finish.

```bash
git pull && npm install
```

```bash
npm run db:reset && npm run db:seed
```

**Reseed every time.** The seed builds its dates relative to today, so a
database seeded last week shows relationships that have drifted further overdue
than the story you are about to tell. It also undoes whatever you changed while
practising.

```bash
npm run build
```

```bash
npm run start
```

Use the production build, not `npm run dev`. Dev mode compiles each route the
first time you visit it, which puts a two-second pause exactly where you do not
want one.

### 1.2 Five minutes before

- [ ] Sign in as **Admin** and click through Dashboard → Relationships →
      Projects once. This warms every route.
- [ ] Sign out. You will start the demo from the sign-in screen.
- [ ] Browser zoom at 100%, or 110% on a projector
- [ ] Close every other tab. Bookmarks bar off. Notifications off.
- [ ] Have a **second browser profile or private window** open and signed in as
      **Viewer**, on the Dashboard. This is how you show roles without spending
      forty seconds signing in and out in front of people.
- [ ] Screenshots of the Dashboard, a relationship, and a project board in a
      folder on the desktop, in case the machine will not cooperate

### 1.3 What you are demonstrating

One sentence, and everything else hangs off it:

> **A venture studio's relationships and its project work, in one operational
> picture — where the health of a relationship is measured by whether it is
> being maintained, not by whether it is about to buy something.**

---

## Part 2 — The twelve-minute demonstration

Timings are for a client meeting. For a marked presentation, see Part 4.

### Scene 1 — Sign in (30 seconds)

Start on the sign-in screen.

> "There are three roles, and I will show you what each one sees. I will start
> as an administrator."

Sign in as **Admin**. Do not read the demonstration credentials aloud; just use
them.

---

### Scene 2 — The dashboard (2 minutes 30)

Let the page sit for a moment before speaking. It is the whole product in one
screen and people read it faster than you can narrate it.

> "This is the single operational picture. Four numbers across the top."

Point at each.

> "Relationships overdue. Due soon. Projects at risk. Projects in flight.
>
> **The first number is the one this system exists to keep at zero.** It counts
> relationships that have gone past the contact rhythm the team agreed for them
> — not a generic rule, each one against its own."

Scroll to *Relationships needing attention*.

> "Worst first. Notice these are not all customers — there is an advisor, an
> investor, an institutional partner. A CRM would have no way to tell you that
> you have not spoken to your advisor in two months, because an advisor is not
> a deal."

**This is the moment the project makes sense to a listener.** Do not rush it.

Scroll to *Projects at risk*.

> "The same picture from the delivery side. This project is at risk, and the
> system says why — overdue by six days, and it has a blocked task."

> "Relationship health and project status, on one screen. That is the brief."

---

### Scene 3 — Follow one thread (3 minutes)

This is the strongest part of the demonstration, because it shows the two
modules are genuinely joined rather than sitting side by side.

Click **Brightpath Health** from the needs-attention list.

> "Brightpath is a customer. Fortnightly cadence, and it has lapsed."

Point at *Contact rhythm* on the right.

> "Agreed cadence, when we last spoke, when it next falls due, who owns it.
> Every relationship has exactly one owner, because one that everybody owns is
> one nobody maintains."

Point at *Value, both ways*.

> "This is the part a CRM does not have. What they give us, and **what we give
> them**. The second one is the field teams forget, and it is the one that
> predicts whether the relationship lasts."

Now log an interaction. Type something real:

> "Fortnightly check-in reinstated. Walked through the waiting-list blocker and
> agreed a date."

**Before clicking the button, point at the checkbox.**

> "This is the interesting one. *This resets the contact clock.* Tick it for a
> real conversation. Leave it unticked for a forwarded link or a one-line
> reply.
>
> If everything counted as contact, 'on track' would mean nothing and you would
> stop trusting the number. This checkbox is what makes the overdue count worth
> reading."

Submit. **Pause and let people see the badge change from Overdue to On track**,
and the *Next due* date move out two weeks.

Scroll to *Project work* in the right column.

> "And this relationship has project work attached."

Click into **Brightpath Scheduling — v1**.

> "Same record, from the project side. Tasks on a board. This one is blocked,
> which is what put the project on the at-risk list you saw on the dashboard."

Scroll to the bottom, to *Conversations about this project*.

> "And the interaction we just logged can be tagged to a project, so the
> conversation and the work sit next to each other. That is the same link, seen
> from the other end."

---

### Scene 4 — The board works (1 minute 30)

Move a task from **To do** to **In progress**, then another to **Done**.

> "Progress recalculates from the tasks — it is never a number somebody typed
> in and forgot to update."

Move a task to **Blocked**.

> "And a blocked task puts the project at risk immediately."

Go back to the Dashboard and show the at-risk count has responded.

---

### Scene 5 — Roles (2 minutes)

Switch to the window already signed in as **Viewer**.

> "This is the same system as a viewer — an advisor or an observer who should
> see everything and change nothing."

Point at the navigation.

> "No Administration. No create buttons anywhere."

Open a relationship.

> "No edit, no archive, and no way to log an interaction."

Now, in the address bar, type `/admin` and press Enter.

> "And it is not just hidden. Going to the address directly puts you back on
> the dashboard. The check runs on the server, inside the action, before the
> form is even read — hiding a button is a courtesy, not a control."

**This lands well with technical audiences and is worth the twenty seconds.**

Back in the Admin window, go to **Administration**.

> "Accounts and roles. And this table is generated from the same code that
> enforces the rules, so the documentation cannot drift from the behaviour."

---

### Scene 6 — The extension seam (1 minute 30)

Go to **Administration → Integrations**.

> "Two adapters. The JSON export is real — it works now."

Click **Export now**. Let the file download.

> "The Jira one is deliberately a stub."

> "We were asked whether this should just be built on Jira's API. The answer is
> no, for a reason worth stating: Jira has projects and tasks, so that half maps
> across. But Jira has no concept of a relationship, no contact cadence, and no
> bidirectional value. The BRM half of this product has nowhere to live inside
> it.
>
> So instead of a connection we built the seam. Anyone who later wants to mirror
> projects into Jira writes an adapter against this interface. Nothing in either
> module changes."

---

### Scene 7 — Close (1 minute)

> "That is the core: dashboard, BRM, project management, on one shared data
> model, plus role-based access.
>
> Everything you have seen runs on synthetic data. Nothing here touches a live
> system.
>
> **What we most need from you is whether the relationship model is right.**
> We have six types — advisor, investor, delivery partner, institutional,
> supplier, customer. Is there something you maintain that does not fit? And
> are the default cadences anywhere near what you actually do?"

**End on that question.** The demonstration is a means of getting a better
answer than a requirements document would have produced.

---

## Part 3 — Questions you will be asked

**"Can it do X?"** — If it does, show it. If it does not, say so and say where
it sits: *"Not in this version. It is in the stretch tier, and the design
document lists it in the recommendations."* Never say "that would be easy to
add" — you do not know that yet, and it sets an expectation.

**"How is this different from a CRM?"** The single best answer, memorised:
> "A CRM organises around a deal moving toward a close. This organises around
> the relationship itself. Half the relationships in here are never going to buy
> anything — advisors, institutional partners — and they are often the ones that
> matter most. A CRM has nowhere to put them."

**"Why not just use Notion / Airtable / a spreadsheet?"**
> "You could hold the data. What you would not get is the cadence calculation,
> the distinction between a real conversation and a forwarded link, and the two
> modules joined so relationship health and project status are one picture. The
> value is in the model, not the storage."

**"Is our data safe?"**
> "There is no real data in it. It is synthetic throughout and connects to
> nothing. When it does hold real data, passwords are hashed with scrypt, every
> write is authorised on the server, and sign-in is rate-limited. What it does
> not yet have is an audit trail — that is the first thing we would add."

**"How much is finished?"**
> "The core is finished: shell, shared data model, both modules, plus
> role-based access which was originally a stretch item. The stretch tier —
> relationship-health scoring, analytics, notifications — is not built, and the
> design document lists it as recommendations with reasoning."

**"Who did what?"** Have the answer ready before you walk in. See the workstream
table in [CONTRIBUTING.md](../CONTRIBUTING.md).

**"Can we use it?"** Be careful. It is a prototype on synthetic data, and the
test plan has manual cases still to run. The honest answer:
> "Not yet, and the test plan says exactly what is still unverified. Give us
> your feedback on the model first — that is the part that is expensive to
> change later."

---

## Part 4 — For the marked presentation

Same system, different emphasis. Markers want the reasoning, not the feature
tour.

**Suggested 15-minute shape:**

| Time | Content |
|---|---|
| 0:00–2:00 | The problem, and why a CRM does not solve it. Use the comparison table from the taxonomy document. |
| 2:00–4:00 | The BRM model. Lifecycle not funnel; cadence not pipeline; value in two directions. |
| 4:00–9:00 | Live demonstration — Scenes 2, 3 and 5 above, compressed. |
| 9:00–11:30 | Architecture. The module boundary rule and why it exists. The one denormalised field and how it is defended. |
| 11:30–13:00 | Quality. 94 tests; contrast measured rather than eyeballed; the four defects found and fixed; what is deliberately not tested. |
| 13:00–15:00 | What we would do next, and why in that order. |

**Three things that earn marks and are easy to leave out:**

1. **Name a decision you got wrong and fixed.** The never-contacted relationship
   showing 461 days overdue is a good one — the calculation was right, the
   seeded data was not, and the fix was to the data. It shows you can tell those
   apart.
2. **Name something you deliberately did not do.** On-hold projects are not
   flagged at risk, because pausing one was a decision the team already
   recorded. Restraint reads as judgement.
3. **Be exact about testing.** "94 tests, and 26 of 41 manual cases still to
   run" is a stronger claim than "fully tested", because it is checkable.

---

## Part 5 — When it goes wrong

| Symptom | Do this |
|---|---|
| Blank page or a server error | `Ctrl+C`, then `npm run db:reset && npm run db:seed && npm run start`. Takes about 40 seconds — talk through the architecture slide while it runs. |
| Dashboard shows nothing needing attention | The seed did not run, or ran days ago. Reseed. |
| Sign-in rejects a correct password | You have hit the rate limit from practising. It clears after 15 minutes; restarting the server clears it immediately. |
| Port 3000 in use | Another copy is running. Close it, or `npm run start -- -p 3001`. |
| Projector colours look washed out | Your OS is in dark mode and the projector is not handling it. Switch the OS to light mode — the application follows it. |
| No network | Nothing here needs one. The database is a local file. Say so; it is a feature. |

**If the application will not start at all:** open the screenshots and present
from those. Say plainly that you are showing screenshots because the machine is
not cooperating, and carry on. Do not spend the audience's time debugging in
front of them — you will not fix it under pressure and it costs more than the
live demonstration is worth.

---

## Part 6 — Rehearsal checklist

Run it end to end twice before the real thing.

- [ ] Full run without notes, timed — under 12 minutes
- [ ] You can say the CRM-versus-BRM answer without reading it
- [ ] You know which relationship you are clicking and what it will show
- [ ] The second window is signed in as Viewer before you start
- [ ] You have practised the recovery command until it is muscle memory
- [ ] You know the three numbers: **94 tests**, **23 relationships**, **10
      projects**
- [ ] You have decided who speaks for each section and where you hand over
