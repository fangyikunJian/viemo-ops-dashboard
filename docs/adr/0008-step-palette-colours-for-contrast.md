# ADR-0008 — Step the reference palette's colours for text contrast

**Status:** Accepted · 17 August 2026

## Context

The interface takes its colours from a validated data-visualisation palette,
chosen so categorical hues stay separable under colour-vision deficiency. Using a
validated palette felt like it settled the accessibility question.

It did not. An audit that computed every rendered text/background pair — through
a canvas, so the `oklch` and `lab` values Tailwind v4 emits resolve correctly —
found **six failures** against WCAG 2.2 Level AA:

| Pair | Measured | Required |
|---|---|---|
| Muted ink on surface | 3.50:1 | 4.5:1 |
| Critical text on its soft tint (light) | 4.13:1 | 4.5:1 |
| Critical text on its soft tint (dark) | 3.66:1 | 4.5:1 |
| Good text on its soft tint (light) | 3.00:1 | 4.5:1 |
| Accent as text on its soft tint | 3.91:1 | 4.5:1 |
| White on accent — primary buttons | 4.42:1 | 4.5:1 |

The root cause is a category error worth naming: **the palette specifies colours
for chart marks, and WCAG holds text to a stricter bar than it holds a bar.** A
3:1 mark is fine as a bar in a chart and fails as a 12-pixel label.

Under the Disability Discrimination Act 1992 this is the standard with the
clearest legal consequence of anything in the project.

## Decision

Keep the palette's values for anything **drawn**; use a measured step from the
same ramp for anything **read**.

The status roles now carry two values — `--status-critical-mark` preserving the
reference value exactly, and `--status-critical` as the text step. Every
replacement was measured, not estimated, and checked against all three light
surfaces and the dark surface.

## Consequences

**Good.** Zero contrast failures across three screens in both modes, re-measured
after the change. The tokens carry their measured ratios in comments, so the next
person changing one knows what it has to clear. The method is repeatable — the
console snippet is in the compliance document, and any new pair can be checked in
about ten seconds.

**Bad.** The interface deviates from the documented reference palette, which has
to be explained rather than pointed at. The accent is a step darker than intended
and the interface is marginally less vivid.

**The general lesson.** Adopting a validated palette validates what it was
validated *for*. Measure the thing you actually shipped.
