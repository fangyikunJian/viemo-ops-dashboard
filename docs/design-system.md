# Design System

**The Viemo Studio Operations Dashboard** · Project UG-S2-28

Two layers, described so either can be rebuilt from the other.

- **§2–§6 — the design layer.** Everything needed to reconstruct the system in
  Figma: tokens, scales, components, states. No code.
- **§7–§9 — the framework layer.** How each token and component exists in the
  codebase, and the contracts a developer must not break.

They are written to be checkable against each other. If a value here disagrees
with `app/globals.css`, the CSS is right and this document is stale — say so in
a pull request.

---

## 1. Principles

Four, in priority order. When two conflict, the earlier wins.

### 1.1 Answer the question before showing the data

The dashboard exists to answer *does today need me?* That answer is a sentence
at the largest size on the page. Figures are supporting evidence and are sized
accordingly.

This is the principle the first build got wrong. Four stat tiles of identical
weight tell the reader that four things matter equally, so the eye has nowhere
to land and the page reads as a template.

### 1.2 Colour means something or it is absent

The interface is neutral. Colour appears for exactly two reasons: **status**
(the four reserved roles) and **the accent** (interactive things). Nothing is
coloured for decoration.

A consequence worth stating: most of a healthy screen has no colour on it at
all, which is what makes the coloured thing findable.

### 1.3 Never colour alone

Every status carries an icon or a word beside its colour. Two of the four status
colours sit below 3:1 on the light surface, and roughly one man in twelve cannot
separate red from green.

### 1.4 Density over comfort, up to the point of noise

This is an operational tool used daily by people who know it, not a marketing
page. Rows are tight, figures are tabular, columns align. But a list of forty
rows must not become a wall — which is why urgency lives in a 3px rail rather
than a badge on every line.

---

## 2. Colour

### 2.1 Method

Colours are **measured, not chosen**. Every text/background pair in the product
was computed against WCAG relative luminance; nothing ships below 4.5:1 for
body text.

The base palette is a validated data-visualisation set. Adopting it did not make
the product compliant — that palette specifies colours for **chart marks**, and
WCAG holds text to a stricter bar than it holds a bar. Six pairs failed on first
measurement. See [ADR-0008](adr/0008-step-palette-colours-for-contrast.md).

### 2.2 Surfaces

Three planes, and the difference between them is what removes the need to draw a
box around everything.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `plane` | `#f9f9f7` | `#0d0d0d` | The page behind everything |
| `surface` | `#fcfcfb` | `#1a1a19` | Cards, lists, the raised layer |
| `sunken` | `#f2f1ed` | `#131312` | The navigation rail, table headers, input fields |

The navigation sits on `sunken` and content on `surface`, so the two read as
different regions without a heavy divider.

### 2.3 Ink

| Token | Light | Dark | Used for | Measured on surface |
|---|---|---|---|---|
| `ink` | `#0b0b0b` | `#ffffff` | Primary text | 18.9:1 |
| `ink-secondary` | `#52514e` | `#c3c2b7` | Supporting prose | 8.1:1 |
| `ink-muted` | `#6e6c66` | `#898781` | Metadata, eyebrow labels | 5.11:1 |

`ink-muted` is a step darker than the source palette's axis-label grey, which
measured 3.5:1 — fine for a chart axis, a failure for interface text.

### 2.4 Accent

`#256abf` light, `#6da7ec` dark. One step down from the palette's slot-1 blue,
which gave 4.42:1 under white button text and 3.91:1 as text on its own tint.

Measured: 5.39:1 white-on-accent, 4.78:1 accent-on-tint.

### 2.5 Status

Reserved. Never used as decoration, never as a series colour.

| Role | Text (light) | Text (dark) | Mark | Meaning |
|---|---|---|---|---|
| good | `#006300` | `#0ca30c` | `#0ca30c` | On track |
| warning | `#fab219` | `#fab219` | `#fab219` | Due soon, watch |
| serious | `#ec835a` | `#ec835a` | `#ec835a` | Reserved, unused |
| critical | `#b52f2f` | `#ec6b6b` | `#d03b3b` | Overdue, at risk |

**Two values per role.** The `-mark` value is the reference palette's, preserved
exactly, for anything *drawn*. The plain value is a measured text step. Use the
text value for anything *read*.

Each has a soft tint for badge backgrounds: `good-soft`, `warning-soft`,
`critical-soft`.

### 2.6 Categorical

Eight hues in a fixed order, never cycled, for relationship-type badges. Assign
by position, never by rank — a filter that changes the visible set must not
repaint the survivors.

---

## 3. Type

### 3.1 Family

`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`

No web font. The system stack renders instantly, needs no network, and on an
operational tool nobody notices its absence. One less thing to fail in a demo.

### 3.2 Scale

Five steps and no more. Enough to build a hierarchy, few enough to stay
consistent.

| Step | Size | Weight | Tracking | Used for |
|---|---|---|---|---|
| **display** | 40px | 640 | −0.03em | The one sentence answering "does today need me?" |
| **figure** | 24px | 620 | −0.02em | A number in a metric strip |
| **title** | 17px | 600 | −0.01em | Page and panel titles |
| **body** | 14px | 400–500 | — | The default |
| **label** | 12px | 400–500 | — | Supporting text, secondary columns |
| **micro** | 11px | 600 | +0.06em, uppercase | Eyebrow labels above a group |

Tracking tightens as size grows — large text set at default tracking looks
loose, small text set tight looks cramped.

### 3.3 Numbers

Every figure in a column or a metric uses `font-variant-numeric: tabular-nums`,
so digits occupy equal width and a column of numbers aligns. Proportional
figures are correct for prose and wrong for a table.

---

## 4. Space

A 4px base unit. Only these steps: **4, 6, 8, 10, 12, 16, 20, 24, 28, 36**.

| Context | Space |
|---|---|
| Inside a badge | 8px × 2px |
| Row padding | 16px × 12px |
| Compact row | 16px × 10px |
| Panel padding | 16–20px |
| Between elements in a group | 6–10px |
| Between groups in a section | 24px |
| Between sections | 36px |

**Space groups things.** The gap between sections is more than twice the gap
inside one, which is what lets a page carry six groups without six borders.

### 4.1 Radius

| Token | Value | Used for |
|---|---|---|
| sm | 4px | Badge, tag |
| md | 6px | Button, input, nav item |
| lg | 8px | Small panel |
| xl | 12px | Card, list container |
| full | 999px | Filter chip, status dot, avatar |

### 4.2 Elevation

Almost none. One shadow: `0 1px 2px rgba(11,11,11,0.05)`, used on the raised
surface and the active nav item. Depth comes from the surface ladder, not from
shadows.

### 4.3 Grid

Content is capped at **76rem** and centred. Page padding steps 20 / 28 / 36px by
breakpoint. The navigation rail is a fixed **15rem** above `lg`, and becomes a
top bar below it.

Two content splits are used: **1.65fr / 1fr** (a list beside a summary) and
**1fr / 1fr**.

---

## 5. Components

Enough detail to rebuild each in Figma. Every one exists in code — §8 maps them.

### 5.1 Badge

A pill: 8px horizontal padding, 2px vertical, 4px radius, 12px text at weight
500, 1px inset ring. Background is a 50-step tint, text a 700-step, ring the
600-step at 20% opacity.

**Variants:** relationship type (8 hues), status, channel, priority, role.
**States:** static. Hover reveals the term's definition via `title`.

### 5.2 Cadence badge

The BRM-specific status pill. Icon + label + optional detail — never colour
alone.

| Status | Icon | Tint |
|---|---|---|
| Overdue | Alert triangle | critical |
| Due soon | Clock | warning |
| On track | Check | good |
| Not tracked | Dashed circle | neutral |

### 5.3 Metric

One figure in a strip. Micro eyebrow label with an optional 6px status dot, the
figure at 24px tabular, an optional 12px note. Whole tile is a link; an arrow
appears at the top right on hover.

Four sit in a bordered container divided by hairlines — **not** four separate
cards. The container is what makes them read as one instrument.

### 5.4 Row

The list primitive. 16px × 12px padding, hairline divider between rows, hover
tint at 70% sunken, and an optional **3px status rail** down the left edge.

The rail is the load-bearing idea: it carries urgency at row level so the name
keeps its space, and it is the first thing the eye picks up when scanning forty
rows.

### 5.5 Section

A titled group. 15px semibold title, optional 12px description, optional right-
aligned action link with a chevron that nudges 2px right on hover. Content
either sits in a bordered container or free on the plane.

### 5.6 Filter chip

Full-radius pill, 10px × 4px, 12px text at weight 500, 1px border. Optional
count in a nested pill. Active state fills with the accent tint and switches the
border to accent.

**Chips are toggles.** Selecting the active value clears it. Every filter lives
in the URL, so a filtered view can be linked and shared.

### 5.7 Button

| Variant | Fill | Text | Border |
|---|---|---|---|
| primary | accent | accent-ink | none |
| secondary | surface | ink | hairline |
| ghost | none | ink-secondary | none |
| danger | none | critical | critical at 30% |

Heights: 32px small, 36px medium. Radius 8px. Hover brightens the primary and
tints the others.

### 5.8 Field

12px label at weight 500 in `ink-secondary`, a required asterisk in critical,
the control, then a 12px hint **or** a 12px error — never both. Errors are
field-level and come from server validation.

### 5.9 Empty state

Dashed border, centred, 24px muted icon, 14px medium title, 12px description,
optional action. Every list has one, and its text says what to do next rather
than only that there is nothing.

---

## 6. Screens

### 6.1 Dashboard

```
┌──────────────────────────────────────────────────────────┐
│ MONDAY 17 AUGUST · AVERY                        ← micro   │
│                                                           │
│ 5 relationships need contact.                   ← display │
│ Another 4 are inside the final fifth…           ← body    │
├───────────┬───────────┬───────────┬───────────────────────┤
│ OVERDUE   │ DUE SOON  │ AT RISK   │ IN FLIGHT   ← strip   │
│ 5         │ 4         │ 1         │ 8                     │
├───────────┴───────────┴───────────┴───────────────────────┤
│ Needs contact                    │ By type                │
│ ▌ rows with rails                │ bar list               │
├──────────────────────────────────┼────────────────────────┤
│ Projects at risk                 │ By status              │
├──────────────────────────────────┴────────────────────────┤
│ Next due            │ Recent contact                      │
└──────────────────────────────────────────────────────────┘
```

Reading order is the decision order: *what is wrong* → *how much* → *which ones*
→ *context*.

### 6.2 Relationships

Header, then a filter panel (search + cadence chips on one row, type and status
chips below), then a table with headed columns:

`Relationship (name + badges + meta) | Owner | Last contact | Cadence`

Rows carry a rail. Below `md` the columns collapse and the cadence moves under
the name.

### 6.3 Relationship detail

Two columns at 2:1. Left is the interaction log with the logging form above it —
the most frequent action, at the top, not behind a button. Right is a stack:
contact rhythm, value both ways, people, linked projects, notes.

### 6.4 Projects

A card grid, 1 / 2 / 3 columns by breakpoint. Cards are used here rather than
rows because a project carries a progress bar and several attributes, which do
not fit a scannable row.

### 6.5 Project detail

Summary strip of four facts, then a four-column task board. Task cards carry
move buttons rather than drag-and-drop — keyboard-operable by construction, and
one click instead of a drag.

---

## 7. Framework layer — tokens

Tokens are CSS custom properties on `:root` in `app/globals.css`, re-exported to
Tailwind through `@theme inline`.

```css
:root { --ink-muted: #6e6c66; }

@media (prefers-color-scheme: dark) {
  :root { --ink-muted: #898781; }
}

@theme inline { --color-ink-muted: var(--ink-muted); }
```

Three rules:

1. **Never define a colour only inside the dark block.** Light is the base; dark
   redefines. A token defined only in dark is `undefined` in light.
2. **Never write a hex value in a component.** If a colour is needed, it needs a
   token.
3. **Any new text/background pair must be measured** before it ships. The
   console snippet is in
   [compliance-and-standards.md](compliance-and-standards.md).

### 7.1 The type scale, and the trap in it

The scale is registered as Tailwind font-size tokens:

```css
@theme inline {
  --text-figure: 1.5rem;
  --text-figure--line-height: 1.1;
  --text-figure--letter-spacing: -0.02em;
  --text-figure--font-weight: 620;
}
```

**Every custom size must also be registered in `lib/cn.ts`.** tailwind-merge
resolves conflicts by class group, and any `text-*` class it does not recognise
falls into `text-color` — so `cn("text-figure", "text-critical")` silently drops
the size and the element renders at whatever it inherited. No error, no warning.

This shipped broken and was found by measuring the rendered page. It is now
covered by regression tests in `lib/cn.test.ts`. Add a token, add it to both
files, in the same commit.

---

## 8. Framework layer — components

| Design component | File | Notes |
|---|---|---|
| Badge | `components/ui/badge.tsx` | Tone → class map is static; Tailwind cannot build a class from a runtime string |
| Cadence / type / status badges | `components/domain/badges.tsx` | Read labels and definitions from `lib/domain/enums.ts` |
| Metric, MetricStrip | `components/ui/metric.tsx` | |
| Section, Row, Rows | `components/ui/section.tsx` | `Row` takes a `rail` colour |
| Filter chip | `components/ui/filter-chip.tsx` | Renders a link, not a button |
| Button, ButtonLink | `components/ui/button.tsx` | |
| Field, Input, Select, Textarea, FormError | `components/ui/form.tsx` | |
| BarList, ProgressBar | `components/ui/bar-list.tsx` | One hue; the reader's job is comparing magnitudes |
| EmptyState, PageHeader | `components/ui/empty-state.tsx` | |
| Sidebar | `components/shell/sidebar.tsx` | Takes nav counts from `lib/dashboard/queries.ts` |

### 8.1 Contracts

- **`components/ui/` knows nothing about the domain.** It takes strings,
  numbers and tones. A component that imports from `lib/brm` belongs in
  `components/domain/` or `components/brm/`.
- **`components/domain/` reads the vocabulary** and nothing else. It never
  queries.
- **Every `<svg>` gets `aria-hidden="true"`** unless it is the only content of a
  control, in which case the control needs an `aria-label`.
- **Server Components by default.** `"use client"` only for state, effects or
  event handlers.

---

## 9. Rebuilding this in Figma

For the design workstream, in order:

1. **Colour styles** from §2. Two modes via variables — light as the base
   collection, dark as a second mode. Name them by role (`ink/muted`), never by
   value (`grey/600`), so a value can change without renaming.
2. **Text styles** from §3, one per step, with tracking baked in.
3. **A 4px spacing variable set** from §4, and radius variables.
4. **Components** from §5, each with its variants as Figma variants. Build the
   Badge first; it is the smallest thing carrying the full token set, so it
   proves the foundation before anything depends on it.
5. **Screens** from §6 at 1440 and 390 wide.

**Keep the names identical to the token names in `globals.css`.** That is what
lets a designer and a developer point at the same thing and be sure it is the
same thing. When they diverge, every conversation costs a translation.
