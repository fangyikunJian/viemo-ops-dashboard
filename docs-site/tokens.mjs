/**
 * The live token specimen.
 *
 * design-system.md describes the tokens in a table; this page renders them, so
 * a designer can see the actual colour and a developer can copy the actual
 * variable name. Every measured contrast ratio here was computed against the
 * surface it is shown on, not estimated.
 */

const SURFACES = [
  ["--plane", "#f9f9f7", "#0d0d0d", "The page behind everything"],
  ["--surface", "#fcfcfb", "#1a1a19", "Cards, lists, the raised layer"],
  ["--surface-sunken", "#f2f1ed", "#131312", "Navigation, table headers, inputs"],
];

const INK = [
  ["--ink", "#0b0b0b", "#ffffff", "Primary text", "18.9:1"],
  ["--ink-secondary", "#52514e", "#c3c2b7", "Supporting prose", "8.1:1"],
  ["--ink-muted", "#6e6c66", "#898781", "Metadata, eyebrow labels", "5.11:1"],
];

const STATUS = [
  ["good", "#006300", "#0ca30c", "#0ca30c", "On track", "6.74:1"],
  ["warning", "#fab219", "#fab219", "#fab219", "Due soon, watch", "—"],
  ["serious", "#ec835a", "#ec835a", "#ec835a", "Reserved, unused", "—"],
  ["critical", "#b52f2f", "#ec6b6b", "#d03b3b", "Overdue, at risk", "5.29:1"],
];

const SERIES = [
  ["1", "#2a78d6", "blue"],
  ["2", "#eb6834", "orange"],
  ["3", "#1baf7a", "aqua"],
  ["4", "#eda100", "yellow"],
  ["5", "#e87ba4", "magenta"],
  ["6", "#008300", "green"],
  ["7", "#4a3aa7", "violet"],
  ["8", "#e34948", "red"],
];

const TYPE = [
  ["display", "42px", "600", "-0.025em", "sans", "The one sentence answering “does today need me?”"],
  ["figure", "26px", "500", "-0.02em", "mono", "A number in a metric strip"],
  ["title", "17px", "600", "-0.01em", "sans", "Page and panel titles"],
  ["body", "14px", "400–500", "—", "sans", "The default"],
  ["label", "12px", "400–500", "—", "sans", "Supporting text, secondary columns"],
  ["micro", "11px", "500", "+0.04em", "mono", "Eyebrow labels, uppercase"],
];

function swatch(hex) {
  return `<span class="swatch" style="background:${hex}"></span>`;
}

export function renderTokens() {
  return `
<div class="prose">
<p class="eyebrow">Design system</p>
<h1>Live tokens</h1>
<p class="lede">
  The actual values, rendered. <a href="design-system.md.html" hidden></a>
  <a href="design-system.html">The design system document</a> explains the
  reasoning; this page is for checking a colour or copying a variable name.
</p>

<div class="callout-inline">
  <strong>Colours here are measured, not chosen.</strong> The base palette was
  built for chart marks, and WCAG holds text to a stricter bar than it holds a
  bar — six pairs failed on first measurement. See
  <a href="adr-0008.html">ADR-0008</a>.
</div>

<h2 id="surfaces">Surfaces</h2>
<p>Three planes. The difference between them is what removes the need to draw a box around everything.</p>
<div class="table-scroll"><table>
  <thead><tr><th>Token</th><th>Light</th><th>Dark</th><th>Used for</th></tr></thead>
  <tbody>
    ${SURFACES.map(
      ([t, l, d, u]) => `<tr>
      <td><code>${t}</code></td>
      <td>${swatch(l)} <code>${l}</code></td>
      <td>${swatch(d)} <code>${d}</code></td>
      <td>${u}</td></tr>`,
    ).join("")}
  </tbody>
</table></div>

<h2 id="ink">Ink</h2>
<div class="table-scroll"><table>
  <thead><tr><th>Token</th><th>Light</th><th>Dark</th><th>Used for</th><th>On surface</th></tr></thead>
  <tbody>
    ${INK.map(
      ([t, l, d, u, r]) => `<tr>
      <td><code>${t}</code></td>
      <td>${swatch(l)} <code>${l}</code></td>
      <td>${swatch(d)} <code>${d}</code></td>
      <td>${u}</td>
      <td class="mono">${r}</td></tr>`,
    ).join("")}
  </tbody>
</table></div>
<p class="note">
  <code>--ink-muted</code> is a step darker than the source palette's axis-label
  grey, which measured 3.50:1 — fine for a chart axis, a failure for interface
  text.
</p>

<h2 id="accent">Accent</h2>
<div class="token-row">
  <div class="token-card">
    ${swatch("#256abf")}
    <div><code>--accent</code> light<br><code>#256abf</code></div>
  </div>
  <div class="token-card">
    ${swatch("#6da7ec")}
    <div><code>--accent</code> dark<br><code>#6da7ec</code></div>
  </div>
  <div class="token-card">
    ${swatch("#eaf2fd")}
    <div><code>--accent-soft</code><br><code>#eaf2fd</code></div>
  </div>
</div>
<p class="note">
  One step down from the palette's slot-1 blue, which gave 4.42:1 under white
  button text. Measured: 5.39:1 white-on-accent, 4.78:1 accent-on-tint.
</p>

<h2 id="status">Status</h2>
<p>Reserved roles. Never decoration, never a series colour, and never shown without an icon or a word beside them.</p>
<div class="table-scroll"><table>
  <thead><tr><th>Role</th><th>Text light</th><th>Text dark</th><th>Mark</th><th>Meaning</th><th>On tint</th></tr></thead>
  <tbody>
    ${STATUS.map(
      ([role, tl, td, mark, meaning, ratio]) => `<tr>
      <td><strong>${role}</strong></td>
      <td>${swatch(tl)} <code>${tl}</code></td>
      <td>${swatch(td)} <code>${td}</code></td>
      <td>${swatch(mark)} <code>${mark}</code></td>
      <td>${meaning}</td>
      <td class="mono">${ratio}</td></tr>`,
    ).join("")}
  </tbody>
</table></div>
<p class="note">
  Two values per role: the <code>-mark</code> value is the reference palette's,
  kept exactly, for anything drawn. The plain value is a text step that clears
  4.5:1 on both the surface and the role's own tint.
</p>

<h2 id="categorical">Categorical</h2>
<p>Eight hues in a fixed order, never cycled. Assigned by position, never by rank — a filter that changes the visible set must not repaint the survivors.</p>
<div class="series-row">
  ${SERIES.map(
    ([n, hex, name]) => `<div class="series-chip">
    <span class="series-swatch" style="background:${hex}"></span>
    <span class="series-n">${n}</span>
    <span class="series-name">${name}</span>
    <code>${hex}</code>
  </div>`,
  ).join("")}
</div>

<h2 id="type">Type</h2>
<p>IBM Plex Sans for prose, IBM Plex Mono for every figure. Five steps and no more — enough to build a hierarchy, few enough to stay consistent.</p>
<div class="table-scroll"><table>
  <thead><tr><th>Step</th><th>Size</th><th>Weight</th><th>Tracking</th><th>Face</th><th>Used for</th></tr></thead>
  <tbody>
    ${TYPE.map(
      ([s, size, w, tr, face, u]) => `<tr>
      <td><code>${s}</code></td>
      <td class="mono">${size}</td>
      <td class="mono">${w}</td>
      <td class="mono">${tr}</td>
      <td>${face}</td>
      <td>${u}</td></tr>`,
    ).join("")}
  </tbody>
</table></div>

<h2 id="spacing">Space and radius</h2>
<p>A 4px base unit, and only these steps: 4, 6, 8, 10, 12, 16, 20, 24, 28, 36. The gap between sections is more than twice the gap inside one — that is what lets a page carry six groups without six borders.</p>
<div class="table-scroll"><table>
  <thead><tr><th>Radius</th><th>Value</th><th>Used for</th></tr></thead>
  <tbody>
    <tr><td>sm</td><td class="mono">4px</td><td>Badge, tag</td></tr>
    <tr><td>md</td><td class="mono">6px</td><td>Button, input, nav item</td></tr>
    <tr><td>lg</td><td class="mono">8px</td><td>Small panel</td></tr>
    <tr><td>xl</td><td class="mono">12px</td><td>Card, list container</td></tr>
    <tr><td>full</td><td class="mono">999px</td><td>Filter chip, status dot, avatar</td></tr>
  </tbody>
</table></div>

<h2 id="checking">Checking a pair yourself</h2>
<p>Paste into the browser console on any screen of the application. It resolves every rendered text/background pair and reports anything below its WCAG threshold. The full snippet is in <a href="compliance.html">the compliance assessment</a>.</p>
</div>`;
}
