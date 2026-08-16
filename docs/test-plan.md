# Test Plan and Results

**The Viemo Studio Operations Dashboard** · Project UG-S2-28
Last run: 17 August 2026

---

## 1. Strategy

The testing follows the architecture rather than aiming at a coverage number.

The system's derived values — cadence status, project progress, project risk —
are pure functions of their inputs and an explicit `now`. No clock reads, no
database. That was a deliberate design decision, and it is what makes the
important behaviour exhaustively testable, including cases that are awkward or
impossible to reach through the interface: a cadence of zero, a relationship
never contacted, an interaction backdated behind an existing one.

Three layers:

| Layer | What it covers | How |
|---|---|---|
| **Unit** | Domain logic: cadence, project health, permissions, password hashing, the integration port | Vitest, no database, no Next.js runtime |
| **Integration** | The one denormalised field in the schema and the invariant that keeps it true | Vitest against a temporary SQLite database built from the project's real migrations |
| **Manual** | Screens, forms, navigation, and role-based access as a user experiences it | Scripted walkthrough, §5 |

Automated tests are not aimed at server actions and Prisma query modules. Those
are thin — validate, check permission, call Prisma, revalidate — and testing
them meaningfully would mean standing up the Next.js request context for
comparatively little return. They are covered by the manual script instead, and
this is stated rather than hidden by a coverage figure.

---

## 2. Running the tests

```bash
npm test
```

```bash
npm run test:coverage
```

---

## 3. Results

**94 tests across 7 files. All passing.**

| File | Tests | Covers |
|---|---|---|
| `lib/brm/cadence.test.ts` | 27 | Cadence status, warning window, summaries, human phrasing |
| `lib/pm/project-health.test.ts` | 19 | Progress, overdue, due-soon, risk, roll-ups |
| `lib/auth/permissions.test.ts` | 12 | Every role against every action |
| `lib/auth/password.test.ts` | 9 | Hashing, verification, malformed input |
| `lib/auth/rate-limit.test.ts` | 8 | Sign-in throttling, window behaviour, per-address isolation |
| `lib/integration/adapters.test.ts` | 6 | The extension port and both adapters |
| `tests/integration/record-interaction.test.ts` | 13 | The `lastContactAt` invariant, against a real database |

Continuous integration runs typecheck, lint, tests, build and the seed on every
push and pull request — `.github/workflows/ci.yml`.

### Coverage of the modules under test

| Module | Statements | Note |
|---|---|---|
| `lib/brm/cadence.ts` | **100%** | The BRM health signal |
| `lib/auth/permissions.ts` | **96.6%** | The access-control policy |
| `lib/pm/project-health.ts` | **95.3%** | Progress and risk |

Overall statement coverage across `lib/` is **30.2%**. That figure is dominated
by the untested-by-design modules named in §1 — server actions, Prisma query
modules, session handling. It is reported here as measured rather than adjusted,
because the number that matters is the first table, not the last line of the
coverage summary.

---

## 4. What the automated tests establish

### 4.1 Cadence — the BRM health signal

| Behaviour | Why it matters |
|---|---|
| Not tracked when no cadence is set | A relationship deliberately off a rhythm must not read as neglected |
| Not tracked when Dormant or Archived | Chasing a relationship you chose to rest defeats the purpose of the state |
| Days since contact still reported when not tracked | The history is shown even where the status is not computed |
| On track well inside the window | |
| Due soon in the final fifth | |
| Due soon, **not overdue**, on the due date itself | An off-by-one here would report healthy relationships as failing |
| Overdue the day after | |
| Days overdue reported accurately | The dashboard sorts by it |
| Prospective relationships tracked | This is where cadence matters most |
| Never-contacted clock runs from creation | A new prospect gets its first window, and cannot disappear |
| Warning window capped at 30 days | An annual cadence would otherwise be flagged for a fifth of its life |
| Zero or negative cadence handled | Bad data must not divide the application by zero |
| Human phrasing across days, months, years | |

### 4.2 Project health

| Behaviour | Why it matters |
|---|---|
| Progress is done ÷ total | |
| Zero tasks gives zero, not a division error | |
| Not overdue on the due date itself | |
| Never overdue once Done or Cancelled | A project delivered late is not an open risk |
| A paused project is reported overdue but **not** at risk | The pause is a decision already taken; re-reporting it drowns the projects that need action |
| At risk when overdue **or** blocked | |
| Every reason listed, not just the first | |
| Blocked-task count pluralised correctly | |
| Roll-ups count live, at-risk and overdue separately | |

### 4.3 Access control

Every role against every action: Viewer reads everything and changes nothing;
Member creates, edits and archives but cannot delete or see accounts; Admin does
everything. An unrecognised role **fails closed** rather than falling through to
a default.

### 4.4 Passwords

The password is never stored; two identical passwords hash differently; the
correct password verifies and a wrong one does not; a malformed or wrong-length
stored hash returns false rather than throwing.

### 4.5 The `lastContactAt` invariant

The only denormalised field in the schema, and the one the whole cadence feature
reads. Tested against a real database, through every route that writes to the
interaction log.

The three cases a naive "only move the date forward" implementation gets wrong
are all covered explicitly:

- **deleting** the most recent interaction walks the value **backwards**
- **downgrading** the latest to incidental falls back to the previous one
- **backdating** an entry does not move the value forward

Plus: incidental interactions never set the field, promoting one to substantive
picks it up, and removing the only interaction returns the field to null.

The final test in that file runs the whole path end to end — a relationship
computed as OVERDUE, an interaction logged, the same relationship re-read and
computed as ON_TRACK.

### 4.6 The integration port

Adapters resolve by id, ids are unique, and — the contract that matters — an
adapter never declares a capability it has no method for. Callers check
`capabilities` before calling, so a declared capability with nothing behind it
would be a crash rather than a handled failure. The JSON export round-trips a
snapshot; the Jira stub declares itself unimplemented and fails with an
explanation rather than an error.

---

## 5. Manual test script

Run after `npm run setup`. Sign-in details are on the sign-in screen.

**Status key.** `PASS` was executed and observed during the build, against the
seeded database. `TO RUN` is specified but has not been executed yet — it is a
checklist for the team, not a claim. Nothing below is marked passing on the
strength of the code looking correct.

**Executed so far: 15 of 41.**

### 5.1 Authentication

| # | Step | Expected | Result |
|---|---|---|---|
| 1.1 | Open `/admin` signed out or under-privileged | Redirected away rather than shown the page | PASS |
| 1.2 | Sign in with a wrong password | "Email or password is incorrect." Same message for an unknown email, so account existence is not disclosed | TO RUN |
| 1.3 | Sign in as Admin | Dashboard, greeting by first name | PASS |
| 1.4 | Sign out | Returned to `/login`; the back button does not restore the session | PASS (sign-out; back-button case TO RUN) |

### 5.2 Dashboard

| # | Step | Expected | Result |
|---|---|---|---|
| 2.1 | Read the four stat tiles | Overdue, due soon, projects at risk, projects in flight — each with an icon and a written status word beside the colour | PASS |
| 2.2 | Check "needs attention" ordering | Overdue first, then due soon; within each, the worst first | PASS |
| 2.3 | Click a stat tile | Filtered list, with the filter visible in the URL | PASS |
| 2.4 | Check the two breakdown panels | Counts match the lists they link to | TO RUN |
| 2.5 | Check recent contact | Latest interactions; those tagged to a project show it | PASS |

### 5.3 BRM module

| # | Step | Expected | Result |
|---|---|---|---|
| 3.1 | Open `/relationships` | All relationships, ordered by urgency then name | PASS |
| 3.2 | Apply a cadence filter | List narrows; chip count matches the number of rows | PASS |
| 3.3 | Click the same chip again | Filter clears — chips are toggles | TO RUN |
| 3.4 | Search by name | Substring match | TO RUN |
| 3.5 | Open a relationship | Cadence, both value directions, contacts, interactions, linked projects | PASS |
| 3.6 | Log a substantive interaction | Appears at the top; last contact becomes "today"; badge changes to On track; next due moves out by the cadence | PASS |
| 3.7 | Log an interaction marked incidental | Appears in the history, labelled "does not reset the clock"; cadence unchanged | TO RUN (covered automatically) |
| 3.8 | Toggle the most recent to incidental | Cadence falls back to the previous substantive interaction | TO RUN (covered automatically) |
| 3.9 | Delete the most recent interaction | Cadence walks backwards correctly | TO RUN (covered automatically) |
| 3.10 | Create a relationship, leaving cadence unset | Saves; shows Not tracked, not Overdue | TO RUN |
| 3.11 | Submit the form with no name | Field-level error; nothing saved | TO RUN |
| 3.12 | Add a contact, marked primary | Any previous primary is demoted | TO RUN |
| 3.13 | Archive a relationship | Status becomes Archived; drops out of cadence tracking; history retained | TO RUN |

### 5.4 PM module

| # | Step | Expected | Result |
|---|---|---|---|
| 4.1 | Open `/projects` | Cards, soonest due first | PASS |
| 4.2 | Filter to at-risk | Only overdue or blocked projects | PASS |
| 4.3 | Open a project | Four-column board, progress, due date, lead, linked relationship | PASS |
| 4.4 | Move a task to Done | Moves column; progress recalculates | TO RUN |
| 4.5 | Move a task to Blocked | Project shows At risk with the reason | TO RUN |
| 4.6 | Add a task | Appears at the end of its column | TO RUN |
| 4.7 | Set a due date before the start date | Rejected with a field error | TO RUN |
| 4.8 | Follow the link to the relationship | Correct relationship; its Project work panel links back | TO RUN |

### 5.5 Access control

| # | Step | Expected | Result |
|---|---|---|---|
| 5.1 | As Viewer, check navigation | No Administration link | PASS |
| 5.2 | As Viewer, open `/admin` directly | Redirected to `/dashboard` | PASS |
| 5.3 | As Viewer, check both list pages | No create buttons | PASS |
| 5.4 | As Viewer, open a relationship | No edit, archive, delete, or interaction form | TO RUN |
| 5.5 | As Viewer, request `/api/export` | HTTP 403 with an explanation | PASS |
| 5.6 | As Member, open a relationship | Can edit and archive; no delete | TO RUN |
| 5.7 | As Admin, open `/admin` | Accounts, role controls, permission matrix | PASS |
| 5.8 | As Admin, try to demote yourself as the only admin | Refused — the system cannot be locked out | TO RUN |
| 5.9 | As Admin, deactivate an account | Its live sessions end immediately | TO RUN |

### 5.6 Integration

| # | Step | Expected | Result |
|---|---|---|---|
| 6.1 | As Admin, open `/admin/integrations` | Both adapters, correctly labelled Available and Stub | TO RUN |
| 6.2 | Export now | JSON downloads with every project and relationship | TO RUN |

### 5.7 Presentation

| # | Step | Expected | Result |
|---|---|---|---|
| 7.1 | Narrow the window to phone width | Sidebar becomes a top bar; no horizontal page scroll; wide tables scroll inside their own container | TO RUN |
| 7.2 | Switch the OS to dark mode | Readable throughout; status colours still distinguishable | PASS |
| 7.3 | Tab through a form | Visible focus ring on every control | TO RUN |
| 7.4 | Check every status colour | Each is accompanied by an icon and a written label | PASS |
| 7.5 | Tab once from a fresh page load | A "Skip to main content" link appears and works | TO RUN |
| 7.6 | Measure text contrast on every screen | No pair below its WCAG threshold — snippet in the compliance document | PASS (dashboard, relationships, projects; other screens TO RUN) |

### 5.8 Accessibility

Assessed in full in [compliance-and-standards.md](compliance-and-standards.md).
Contrast, heading structure, control labelling and icon hiding were **measured**
rather than inspected. **No assistive-technology testing has been done** — that
is the largest remaining gap in the accessibility claim, and automated checks
find perhaps a third of real barriers.

---

## 6. Defects found and fixed

| Defect | Cause | Fix |
|---|---|---|
| A never-contacted relationship showed as 461 days overdue | The seed gave every relationship a creation date up to two years back, including ones that had never been contacted, so the first-contact clock had been running since then. Also allowed a creation date **after** the last contact. | Seed now derives creation dates from the contact history: recent for never-contacted records, always before the first interaction otherwise |
| The Administration page failed to load with `The "original" argument must be of type Function` | A client component imported a constant from `lib/auth/password`, pulling `node:crypto` into the browser bundle, where `promisify(scrypt)` received `undefined` | Rules split into `lib/auth/password-rules.ts` with no Node imports; the client imports that |
| Two neighbouring relationships showed identical interaction summaries | The seed always started its phrasing list at index 0 | Per-relationship offset into the phrasing list |
| All six relationship types had exactly three records, which read as fabricated | Seed coincidence | More relationships added, with a distribution closer to a real studio's |
| Six WCAG 2.2 AA contrast failures across the design tokens | The reference palette specifies colours for **chart marks**; WCAG holds text to a stricter bar. Applying a validated chart palette to interface text is not the same as being compliant. | Status roles split into a `-mark` value (palette preserved) and a measured text step. Re-measured: zero failures across three screens in both modes. See [ADR-0008](adr/0008-step-palette-colours-for-contrast.md) |
| No skip link — WCAG 2.4.1 Bypass Blocks, **Level A** | The navigation rail repeats on every screen with no way past it | Skip link added as the first item in the tab order |
| Sign-in was an unlimited password oracle | No throttling; scrypt made each attempt expensive but did not bound the number of attempts | 8 attempts per 15 minutes per address, keyed by email so one person cannot lock out an office |

---

## 7. Not tested

Stated plainly rather than left to be discovered:

- **Concurrency.** Two people editing the same record at once. SQLite is
  single-writer and the demonstration is single-user.
- **Volume.** The lists load everything; behaviour past a few hundred
  relationships is unmeasured.
- **Browsers other than Chromium.** No cross-browser matrix was run.
- **Screen readers.** Semantic HTML, focus states, `aria-current`, labelled
  controls and non-colour status cues are all in place, but no assistive
  technology was used to verify the result.
- **Security beyond the basics.** Hashed passwords, opaque session tokens,
  server-side authorisation on every write, and no account enumeration on
  sign-in. No penetration testing, no rate limiting, no CSRF testing beyond what
  the framework provides.
