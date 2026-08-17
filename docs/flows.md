# MVP Flows

**The Viemo Studio Operations Dashboard** · Project UG-S2-28

The flows the MVP is built around, as diagrams. Every one is Mermaid, so GitHub
renders it inline and the source stays reviewable in a pull request — a picture
that lives in a design file drifts from the product the week after it is drawn.

**For the design workstream:** §9 maps each diagram to what to build in Figma
and what to leave here.

---

## 1. Information architecture

Every screen in the product, and how someone reaches it.

```mermaid
flowchart TD
    Start([Visitor]) --> Login[/Sign in/]
    Login -->|credentials rejected| Login
    Login -->|8 failures in 15 min| Locked[/Locked for 15 minutes/]
    Login -->|accepted| Dash

    Dash[Dashboard<br/>the one operational picture]

    Dash --> RelList[Relationships<br/>list + filters]
    Dash --> ProjList[Projects<br/>card grid + filters]
    Dash --> Admin[Administration<br/>ADMIN only]

    RelList --> RelNew[/New relationship/]
    RelList --> RelDetail[Relationship detail]
    RelDetail --> RelEdit[/Edit relationship/]
    RelDetail -.->|linked project| ProjDetail
    RelDetail --> LogInt[/Log interaction/]
    RelDetail --> AddContact[/Add contact/]

    ProjList --> ProjNew[/New project/]
    ProjList --> ProjDetail[Project detail<br/>task board]
    ProjDetail --> ProjEdit[/Edit project/]
    ProjDetail --> AddTask[/Add task/]
    ProjDetail -.->|delivered for| RelDetail

    Admin --> Accounts[/Accounts and roles/]
    Admin --> Integrations[Integrations]
    Integrations --> Export[/JSON export/]

    classDef entry fill:#eaf2fd,stroke:#256abf,color:#0b0b0b
    classDef screen fill:#fcfcfb,stroke:#c3c2b7,color:#0b0b0b
    classDef restricted fill:#f2f1ed,stroke:#898781,color:#0b0b0b
    class Dash entry
    class RelList,RelDetail,ProjList,ProjDetail screen
    class Admin,Accounts,Integrations restricted
```

**The dotted lines are the point.** They are the two seams between the modules —
the only places the BRM and PM halves meet, and the only reason the dashboard
can show one picture rather than two.

---

## 2. The core loop

The reason the product exists. Everything else supports this cycle.

```mermaid
flowchart LR
    A[Dashboard says<br/>5 need contact] --> B[Open the worst one]
    B --> C[Read the history<br/>and what they give us]
    C --> D[Have the conversation]
    D --> E[Log it as substantive]
    E --> F[Cadence clock resets<br/>badge turns On track]
    F --> G[Count drops to 4]
    G --> A

    classDef act fill:#eaf2fd,stroke:#256abf,color:#0b0b0b
    classDef sys fill:#e8f6e8,stroke:#006300,color:#0b0b0b
    class B,C,D,E act
    class A,F,G sys
```

Blue is the person; green is the system. **The system's job is the first and
last step — telling someone what needs them, and confirming it is handled.**
A tool that only stored records would have neither.

---

## 3. Logging an interaction

The most frequent action in the product, and the one carrying the decision the
whole cadence feature rests on.

```mermaid
flowchart TD
    Start([On a relationship]) --> Perm{May the role<br/>create interactions?}
    Perm -->|Viewer| Hidden[Form not rendered]
    Perm -->|Member or Admin| Linked{Account linked<br/>to a team member?}

    Linked -->|no| Explain[Explain that an interaction<br/>needs an author]
    Linked -->|yes| Form[/Date · Channel · Summary<br/>Project · Substantive?/]

    Form --> Submit[Submit]
    Submit --> Check{Server: role,<br/>then validate}
    Check -->|refused| Err[Return the reason]
    Check -->|invalid| Field[Field-level errors]
    Check -->|valid| Future{Dated in<br/>the future?}

    Future -->|yes| Field
    Future -->|no| Tx[[Transaction]]

    Tx --> Write[Write the interaction]
    Write --> Recalc[Recompute lastContactAt<br/>from the whole log]
    Recalc --> Commit[[Commit]]

    Commit --> Sub{Was it<br/>substantive?}
    Sub -->|yes| Reset[Clock resets<br/>cadence recalculates]
    Sub -->|no| Keep[Recorded in history<br/>clock untouched]

    Reset --> Done([Dashboard and rail update])
    Keep --> Done

    classDef gate fill:#fef5e1,stroke:#fab219,color:#0b0b0b
    classDef danger fill:#fbeaea,stroke:#b52f2f,color:#0b0b0b
    classDef good fill:#e8f6e8,stroke:#006300,color:#0b0b0b
    class Perm,Linked,Check,Future,Sub gate
    class Hidden,Err,Field danger
    class Reset,Keep,Done good
```

**Two things this diagram exists to make visible.**

The permission is checked **twice** — once to decide whether to render the form,
and again on the server before the input is read. Only the second is a boundary;
the first is a courtesy.

`lastContactAt` is **recomputed from the whole log**, not compared against the
new date. A naive "only move forward" is wrong three ways, all covered in
`tests/integration/record-interaction.test.ts` — see
[ADR-0002](adr/0002-derive-values-rather-than-store-them.md).

---

## 4. Cadence, as a state machine

The BRM module's health signal. Derived on every read, never stored.

```mermaid
stateDiagram-v2
    [*] --> NotTracked: relationship created

    NotTracked --> OnTrack: cadence agreed<br/>and status is Active or Prospective
    OnTrack --> NotTracked: cadence removed,<br/>or moved to Dormant / Archived

    OnTrack --> DueSoon: inside the final fifth<br/>of the window
    DueSoon --> Overdue: window lapsed
    Overdue --> OnTrack: substantive contact logged
    DueSoon --> OnTrack: substantive contact logged

    DueSoon --> NotTracked: moved to Dormant
    Overdue --> NotTracked: moved to Dormant

    note right of NotTracked
        Not the same as Overdue.
        A relationship deliberately
        rested is not one being
        neglected — collapsing the two
        makes the overdue count
        meaningless.
    end note

    note right of Overdue
        The single number the
        dashboard exists to
        keep at zero.
    end note
```

The window: `clockStart = lastContactAt ?? createdAt`, `dueAt = clockStart +
cadenceDays`, warning at `clamp(ceil(cadenceDays × 0.2), 1, 30)` days out.

**A relationship never contacted runs its clock from when it was added** —
adding it is what creates the obligation to make first contact, so a new
prospect gets a full first window and still cannot silently disappear.

---

## 5. Relationship lifecycle

A cycle, not a funnel. This is the structural difference from a CRM.

```mermaid
stateDiagram-v2
    [*] --> Prospective: identified as worth building
    Prospective --> Active: established, two-way
    Active --> Dormant: deliberately rested
    Dormant --> Active: revived
    Active --> Archived: no longer maintained
    Dormant --> Archived
    Archived --> Dormant: restored
    Prospective --> Archived: did not come to anything

    note left of Dormant
        A legitimate resting state.
        Not cadence-tracked.
    end note

    note right of Archived
        History retained.
        Deletion is Admin-only
        and destroys the context
        that explains why.
    end note
```

**Nothing in the code treats a later state as better than an earlier one.** A
CRM pipeline advances toward a close and the record then leaves the board; here
a relationship can move around this cycle for years in either direction.

---

## 6. Project risk

Overdue is a fact. At risk is a judgement, and it is narrower.

```mermaid
flowchart TD
    P([Project]) --> Live{Status}

    Live -->|Done or Cancelled| Closed[Never overdue<br/>never at risk]
    Live -->|Planning · Active · On hold| Due{Past its<br/>due date?}

    Due -->|yes| Overdue[isOverdue = true]
    Due -->|no| NotOverdue[isOverdue = false]

    Overdue --> Judge{Status is<br/>Planning or Active?}
    NotOverdue --> Judge

    Judge -->|On hold| Paused[Reported overdue,<br/>NOT at risk]
    Judge -->|yes| Blocked{Any blocked task,<br/>or overdue?}

    Blocked -->|neither| Fine[On schedule]
    Blocked -->|either| Risk[At risk<br/>+ every reason listed]

    classDef danger fill:#fbeaea,stroke:#b52f2f,color:#0b0b0b
    classDef good fill:#e8f6e8,stroke:#006300,color:#0b0b0b
    classDef neutral fill:#f2f1ed,stroke:#898781,color:#0b0b0b
    class Risk,Overdue danger
    class Fine,Closed good
    class Paused,NotOverdue neutral
```

**A paused project is never flagged at risk, even when overdue.** Pausing it was
a decision the team already took and recorded; reporting it back as a risk asks
them to act on their own choice, and it buries the projects that need attention.

---

## 7. Authorisation

Three layers, of which one is a boundary.

```mermaid
flowchart TD
    Req([Request]) --> Session{Valid session?}
    Session -->|no| Login[/Redirect to sign in/]
    Session -->|yes| Route{May the role<br/>open this route?}

    Route -->|no| Bounce[/Redirect to dashboard/]
    Route -->|yes| Render[Render the page]

    Render --> UI{May the role<br/>use this control?}
    UI -->|no| Hide[Control not rendered<br/>— a courtesy]
    UI -->|yes| Show[Control rendered]

    Show --> Action([Server action])
    Hide -.->|crafted request| Action

    Action --> Gate{can role, action, resource}
    Gate -->|no| Refuse[Refuse before<br/>reading the form]
    Gate -->|yes| Validate[Validate, then write]

    classDef boundary fill:#fbeaea,stroke:#b52f2f,color:#0b0b0b,stroke-width:2px
    classDef soft fill:#f2f1ed,stroke:#898781,color:#0b0b0b
    class Gate,Refuse boundary
    class Hide,Show,UI soft
```

**The dotted line is why the last gate exists.** Someone who can construct a
POST reaches the action whether or not the interface showed them a button. The
red gate is the only one that holds — see
[ADR-0006](adr/0006-authorise-inside-server-actions.md).

---

## 8. Data model

The shared spine. Both modules are built on it and meet at two nullable keys.

```mermaid
erDiagram
    User ||--o| TeamMember : "acts as"
    User ||--o{ Session : has
    TeamMember ||--o{ Relationship : owns
    TeamMember ||--o{ Project : leads
    TeamMember ||--o{ Task : "assigned"
    TeamMember ||--o{ Interaction : logs

    Organisation ||--o{ Relationship : "groups (optional)"

    Relationship ||--o{ Contact : has
    Relationship ||--o{ Interaction : "logged against"
    Relationship ||--o{ Project : "delivered for (SEAM)"

    Project ||--o{ Task : contains
    Project ||--o{ Interaction : "discussed in (SEAM)"

    Tag }o--o{ Relationship : labels
    Tag }o--o{ Project : labels

    Relationship {
        string name
        string type "6 values"
        string status "4 values, cyclical"
        int cadenceDays "nullable"
        datetime lastContactAt "denormalised"
        string valueToUs
        string valueToThem
    }

    Project {
        string name
        string status "5 values"
        datetime dueDate
        string relationshipId "nullable SEAM"
    }

    Interaction {
        datetime occurredAt
        string channel
        string summary
        boolean isSubstantive "resets the clock"
        string projectId "nullable SEAM"
    }
```

**Both seams are nullable on purpose.** A project can be internal; a
conversation need not be about a project. That is what lets either module be
built and demonstrated without the other, and it is what makes five people
working in parallel possible —
[ADR-0003](adr/0003-modules-never-import-each-other.md).

---

## 9. What to build in Figma, and what to leave here

Not everything belongs in a design file. The split:

| Diagram | Figma? | Why |
|---|---|---|
| §1 Information architecture | **Yes** | Designers need the map to place screens against |
| §2 Core loop | **Yes** | The strongest slide in any presentation; worth drawing properly |
| §3 Logging an interaction | **Yes** — as a screen flow | Redraw as wireframes with the form states, not as boxes |
| §4 Cadence state machine | No | Logic, not interface. Link to it from the design file. |
| §5 Relationship lifecycle | **Yes** — simplified | Four states as a loop; it is the product's central argument |
| §6 Project risk | No | Logic. The interface only shows the outcome. |
| §7 Authorisation | No | Backend. Designers need the outcome — which controls each role sees. |
| §8 Data model | No | Engineering. |

### Building §1 and §2 in Figma

1. One frame each, 1920 × 1080, so they double as presentation slides.
2. Nodes: 8px radius, 1px `line` border, `surface` fill. Type at **body** (14px)
   weight 500.
3. Connectors: 1.5px in `ink-muted`. **Seam connectors dashed** — the distinction
   is the content, not decoration.
4. Colour only where it means something: `accent-soft` for entry points,
   `good-soft` for system responses, `critical-soft` for failure paths.
5. Label groups with the **micro** style (11px, mono, uppercase, `ink-muted`),
   matching the eyebrow in the product.

Full token values are in [design-system.md](design-system.md) §2–§4. Keeping the
Figma names identical to the token names is what lets a designer and a developer
point at the same thing and be sure it is the same thing.

### Redrawing §3 as a screen flow

The version above is a decision diagram — useful for engineers, wrong for a
design review. For Figma, draw the four states of the form instead:

`empty → filled → submitting → logged (badge flipped, clock reset)`

with the substantive checkbox called out, because that single control is what
makes the cadence figure worth believing.
