const PptxGenJS = require("pptxgenjs");

// ── Palette: the product's own tokens, so deck and product match ──────────
const INK = "0B0B0B";
const INK2 = "52514E";
const MUTED = "6E6C66";
const SURFACE = "FCFCFB";
const SUNKEN = "F2F1ED";
const LINE = "E1E0D9";
const ACCENT = "256ABF";
const ACCENT_SOFT = "EAF2FD";
const CRIT = "B52F2F";
const CRIT_SOFT = "FBEAEA";
const GOOD = "006300";
const GOOD_SOFT = "E8F6E8";
const WARN_SOFT = "FEF5E1";
const WARN_INK = "8A5B00";
const DARK = "17181A";

// Sans for prose, mono for every figure — the same pairing as the product.
const SANS = "Calibri";
const MONO = "Courier New";

const W = 13.333;
const H = 7.5;
const M = 0.75; // margin

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.author = "UG-S2-28";
pres.title = "Viemo Studio Operations Dashboard — Team Briefing";

// ── helpers ───────────────────────────────────────────────────────────────

function darkSlide() {
  const s = pres.addSlide();
  s.background = { color: DARK };
  return s;
}

function lightSlide(title, kicker) {
  const s = pres.addSlide();
  s.background = { color: SURFACE };
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.45, w: W - M * 2, h: 0.25,
      fontFace: MONO, fontSize: 11, bold: true, color: MUTED, charSpacing: 1.2,
      margin: 0,
    });
  }
  if (title) {
    s.addText(title, {
      x: M, y: 0.75, w: W - M * 2, h: 0.7,
      fontFace: SANS, fontSize: 34, bold: true, color: INK, margin: 0,
    });
  }
  return s;
}

/** A figure block: big mono numeral over a small label. The deck's motif. */
function figure(slide, { x, y, w, value, label, note, tone }) {
  const colour =
    tone === "crit" ? CRIT : tone === "good" ? GOOD : tone === "accent" ? ACCENT : INK;
  slide.addText(String(value), {
    x, y, w, h: 0.85,
    fontFace: MONO, fontSize: 46, bold: true, color: colour, margin: 0,
  });
  slide.addText(label.toUpperCase(), {
    x, y: y + 0.82, w, h: 0.25,
    fontFace: MONO, fontSize: 10, bold: true, color: MUTED, charSpacing: 1, margin: 0,
  });
  if (note) {
    slide.addText(note, {
      x, y: y + 1.06, w, h: 0.5,
      fontFace: SANS, fontSize: 12, color: INK2, margin: 0,
    });
  }
}

/** A soft card. No edge stripes — a tint and a hairline only. */
function card(slide, { x, y, w, h, fill, line }) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fill || SUNKEN },
    line: { color: line || LINE, width: 1 },
    rectRadius: 0.09,
  });
}

/** A numbered step disc. */
function disc(slide, { x, y, n, tone }) {
  const bg = tone === "good" ? GOOD_SOFT : tone === "crit" ? CRIT_SOFT : ACCENT_SOFT;
  const fg = tone === "good" ? GOOD : tone === "crit" ? CRIT : ACCENT;
  slide.addShape(pres.ShapeType.ellipse, {
    x, y, w: 0.42, h: 0.42,
    fill: { color: bg }, line: { color: fg, width: 1 },
  });
  slide.addText(String(n), {
    x, y, w: 0.42, h: 0.42,
    fontFace: MONO, fontSize: 13, bold: true, color: fg,
    align: "center", valign: "middle", margin: 0,
  });
}

function footer(slide, text) {
  slide.addText(text, {
    x: M, y: H - 0.55, w: W - M * 2, h: 0.3,
    fontFace: SANS, fontSize: 10, color: MUTED, margin: 0,
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 1 — Title
// ═════════════════════════════════════════════════════════════════════════
{
  const s = darkSlide();

  s.addText("UG-S2-28  ·  ICT CAPSTONE  ·  SEMESTER 2 2026", {
    x: M, y: 1.5, w: W - M * 2, h: 0.3,
    fontFace: MONO, fontSize: 12, bold: true, color: "8C8F94", charSpacing: 1.5, margin: 0,
  });

  s.addText("The Viemo Studio\nOperations Dashboard", {
    x: M, y: 2.0, w: 9.2, h: 1.9,
    fontFace: SANS, fontSize: 46, bold: true, color: "FFFFFF", lineSpacing: 52, margin: 0,
  });

  s.addText(
    "A venture studio's relationships and its project work, in one operational picture.",
    {
      x: M, y: 4.05, w: 8.6, h: 0.6,
      fontFace: SANS, fontSize: 17, color: "C9CBCF", margin: 0,
    },
  );

  // Figures as the motif, on the title too.
  const stats = [
    ["102", "TESTS"],
    ["23", "RELATIONSHIPS"],
    ["10", "PROJECTS"],
    ["9", "DOCUMENTS"],
  ];
  stats.forEach(([v, l], i) => {
    const x = M + i * 1.95;
    s.addText(v, {
      x, y: 5.15, w: 1.8, h: 0.6,
      fontFace: MONO, fontSize: 30, bold: true, color: "FFFFFF", margin: 0,
    });
    s.addText(l, {
      x, y: 5.72, w: 1.8, h: 0.25,
      fontFace: MONO, fontSize: 9, bold: true, color: "8C8F94", charSpacing: 1, margin: 0,
    });
  });

  s.addText("Team briefing  ·  read before you write code", {
    x: M, y: H - 0.75, w: 8, h: 0.3,
    fontFace: SANS, fontSize: 11, color: "8C8F94", margin: 0,
  });

  s.addNotes(
    "Ten minutes. The goal is that everyone leaves knowing what we are building, " +
    "where their code goes, and the three rules that get a pull request rejected.",
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 2 — What we are building
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("Three layers, one shared data model", "What we are building");

  const layers = [
    {
      t: "Dashboard shell",
      d: "Navigation, and a home screen that answers one question: does today need me?",
      tone: ACCENT, soft: ACCENT_SOFT,
    },
    {
      t: "BRM module",
      d: "Business Relationship Management. Advisors, investors, partners, institutions, suppliers, customers — each kept to its own agreed rhythm.",
      tone: ACCENT, soft: ACCENT_SOFT,
    },
    {
      t: "Project Management module",
      d: "Projects, tasks, owners, statuses, deadlines. Progress and risk derived from the work, never typed in.",
      tone: ACCENT, soft: ACCENT_SOFT,
    },
  ];

  layers.forEach((l, i) => {
    const y = 1.75 + i * 1.32;
    card(s, { x: M, y, w: W - M * 2, h: 1.12, fill: SURFACE, line: LINE });
    disc(s, { x: M + 0.35, y: y + 0.35, n: i + 1 });
    s.addText(l.t, {
      x: M + 1.05, y: y + 0.2, w: 3.4, h: 0.35,
      fontFace: SANS, fontSize: 17, bold: true, color: INK, margin: 0,
    });
    s.addText(l.d, {
      x: M + 1.05, y: y + 0.58, w: W - M * 2 - 1.5, h: 0.45,
      fontFace: SANS, fontSize: 13, color: INK2, margin: 0,
    });
  });

  card(s, { x: M, y: 5.72, w: W - M * 2, h: 0.82, fill: SUNKEN, line: LINE });
  s.addText(
    [
      { text: "The spine:  ", options: { bold: true, color: INK } },
      {
        text: "one Prisma schema both modules are built on. It is simultaneously the implementation and a graded deliverable.",
        options: { color: INK2 },
      },
    ],
    {
      x: M + 0.35, y: 5.95, w: W - M * 2 - 0.7, h: 0.4,
      fontFace: SANS, fontSize: 13, margin: 0,
    },
  );

  s.addNotes("The shared data model is why this is one product and not two apps in one repo.");
}

// ═════════════════════════════════════════════════════════════════════════
// 3 — Why not a CRM
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("A CRM has nowhere to put an advisor", "The argument");

  s.addText(
    "Half the relationships that decide whether a studio succeeds are never going to buy anything.",
    {
      x: M, y: 1.55, w: 11.5, h: 0.4,
      fontFace: SANS, fontSize: 15, color: INK2, margin: 0,
    },
  );

  const rows = [
    ["Organising unit", "A deal", "The relationship itself"],
    ["Status", "Pipeline stage — ordered, terminal", "Lifecycle — a cycle, either direction"],
    ["Health measure", "Time to close", "Time since substantive contact"],
    ["Value", "One direction, a number", "Two directions, described"],
    ["Who counts", "Customers and prospects", "Six types; customer is one"],
  ];

  const tx = M, tw = W - M * 2;
  const c1 = 2.9, c2 = 4.1;

  // header
  s.addText("", { x: tx, y: 2.15, w: tw, h: 0.02 }); // spacer
  s.addText("CRM", {
    x: tx + c1, y: 2.15, w: c2, h: 0.3,
    fontFace: MONO, fontSize: 10, bold: true, color: MUTED, charSpacing: 1, margin: 0,
  });
  s.addText("THIS BRM", {
    x: tx + c1 + c2 + 0.3, y: 2.15, w: c2, h: 0.3,
    fontFace: MONO, fontSize: 10, bold: true, color: ACCENT, charSpacing: 1, margin: 0,
  });

  rows.forEach((r, i) => {
    const y = 2.55 + i * 0.78;
    if (i % 2 === 0) {
      s.addShape(pres.ShapeType.rect, {
        x: tx - 0.15, y: y - 0.1, w: tw + 0.3, h: 0.72,
        fill: { color: SUNKEN }, line: { color: SUNKEN, width: 0 },
      });
    }
    s.addText(r[0], {
      x: tx, y, w: c1 - 0.2, h: 0.5,
      fontFace: SANS, fontSize: 13, bold: true, color: INK, margin: 0, valign: "top",
    });
    s.addText(r[1], {
      x: tx + c1, y, w: c2, h: 0.5,
      fontFace: SANS, fontSize: 12.5, color: MUTED, margin: 0, valign: "top",
    });
    s.addText(r[2], {
      x: tx + c1 + c2 + 0.3, y, w: c2, h: 0.5,
      fontFace: SANS, fontSize: 12.5, color: INK, margin: 0, valign: "top",
    });
  });

  footer(s, "Full definitions: docs/brm-taxonomy.md");
  s.addNotes(
    "If you remember one slide, this one. It is the project's central argument and " +
    "the thing markers and the client will both push on.",
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 4 — The core loop
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("The loop the product exists to close", "How it works");

  const steps = [
    { n: 1, t: "Dashboard says", d: "5 need contact", tone: "good" },
    { n: 2, t: "Open the worst", d: "Read the history", tone: "" },
    { n: 3, t: "Have the conversation", d: "The actual work", tone: "" },
    { n: 4, t: "Log it", d: "Mark it substantive", tone: "" },
    { n: 5, t: "Clock resets", d: "Count drops to 4", tone: "good" },
  ];

  steps.forEach((st, i) => {
    const x = M + i * 2.42;
    card(s, { x, y: 2.1, w: 2.15, h: 1.85, fill: st.tone === "good" ? GOOD_SOFT : SURFACE, line: st.tone === "good" ? GOOD : LINE });
    disc(s, { x: x + 0.25, y: 2.35, n: st.n, tone: st.tone === "good" ? "good" : "" });
    s.addText(st.t, {
      x: x + 0.2, y: 2.95, w: 1.75, h: 0.5,
      fontFace: SANS, fontSize: 13, bold: true, color: INK, margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.2, y: 3.42, w: 1.75, h: 0.4,
      fontFace: SANS, fontSize: 11.5, color: INK2, margin: 0,
    });
    if (i < steps.length - 1) {
      // Sits in the 0.27" gap between cards, not on a card edge.
      s.addText("›", {
        x: x + 2.16, y: 2.78, w: 0.23, h: 0.4,
        fontFace: SANS, fontSize: 20, color: MUTED, align: "center", margin: 0,
      });
    }
  });

  card(s, { x: M, y: 4.5, w: W - M * 2, h: 1.72, fill: SUNKEN, line: LINE });
  s.addText("Green is the system. Blue is the person.", {
    x: M + 0.4, y: 4.78, w: 10.9, h: 0.35,
    fontFace: SANS, fontSize: 15, bold: true, color: INK, margin: 0,
  });
  s.addText(
    "The system's whole job is the first step and the last — telling someone what needs them, and confirming it is handled. A tool that only stored records would do neither, and that is the difference between this and a contact list.",
    {
      x: M + 0.4, y: 5.18, w: 10.9, h: 0.85,
      fontFace: SANS, fontSize: 13, color: INK2, margin: 0,
    },
  );

  footer(s, "docs/flows.md §2");
  s.addNotes("Walk this live in the demo. It is the most convincing 90 seconds we have.");
}

// ═════════════════════════════════════════════════════════════════════════
// 5 — Status
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("Where the build actually is", "Status");

  figure(s, { x: M, y: 1.7, w: 2.6, value: "102", label: "Tests passing", note: "7 files, CI green on every push", tone: "good" });
  figure(s, { x: M + 3.05, y: 1.7, w: 2.6, value: "0", label: "Contrast failures", note: "Measured, both colour modes", tone: "good" });
  figure(s, { x: M + 6.1, y: 1.7, w: 2.6, value: "8", label: "Defects fixed", note: "Each documented in the test plan", tone: "accent" });
  figure(s, { x: M + 9.15, y: 1.7, w: 2.6, value: "26", label: "Cases still to run", note: "Of 41 manual cases", tone: "crit" });

  const done = [
    "Shared data model, migrations, synthetic seed",
    "BRM: relationships, contacts, interaction log, cadence",
    "PM: projects, tasks, board, progress and risk",
    "Dashboard joining both modules",
    "Roles and server-side authorisation",
    "Integration seam, CI, nine documents",
  ];
  const notDone = [
    "Relationship-health scoring (needs a client-agreed formula)",
    "Notifications and digests",
    "Analytics views",
    "Audit trail, MFA, backups",
    "Screen-reader verification",
  ];

  card(s, { x: M, y: 3.7, w: 5.9, h: 2.9, fill: GOOD_SOFT, line: GOOD });
  s.addText("BUILT AND VERIFIED", {
    x: M + 0.35, y: 3.95, w: 5.2, h: 0.3,
    fontFace: MONO, fontSize: 10, bold: true, color: GOOD, charSpacing: 1, margin: 0,
  });
  s.addText(
    done.map((d, i) => ({ text: d, options: { bullet: true, breakLine: i < done.length - 1 } })),
    {
      x: M + 0.35, y: 4.3, w: 5.2, h: 2.1,
      fontFace: SANS, fontSize: 12.5, color: INK, paraSpaceAfter: 5, margin: 0,
    },
  );

  card(s, { x: M + 6.4, y: 3.7, w: 5.4, h: 2.9, fill: SUNKEN, line: LINE });
  s.addText("NOT BUILT — DELIBERATELY", {
    x: M + 6.75, y: 3.95, w: 4.7, h: 0.3,
    fontFace: MONO, fontSize: 10, bold: true, color: MUTED, charSpacing: 1, margin: 0,
  });
  s.addText(
    notDone.map((d, i) => ({ text: d, options: { bullet: true, breakLine: i < notDone.length - 1 } })),
    {
      x: M + 6.75, y: 4.3, w: 4.7, h: 2.1,
      fontFace: SANS, fontSize: 12.5, color: INK2, paraSpaceAfter: 5, margin: 0,
    },
  );

  s.addNotes(
    "Saying 'the core is complete and here is what is not' is a stronger claim than " +
    "'it is finished', because it is checkable.",
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 6 — Architecture / boundary
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("The rule that lets five people work at once", "Architecture");

  // dashboard box
  card(s, { x: 3.9, y: 1.6, w: 5.5, h: 0.85, fill: ACCENT_SOFT, line: ACCENT });
  s.addText("lib/dashboard  —  the only cross-module reads", {
    x: 3.9, y: 1.6, w: 5.5, h: 0.85,
    fontFace: MONO, fontSize: 13, bold: true, color: ACCENT,
    align: "center", valign: "middle", margin: 0,
  });

  // two modules
  card(s, { x: 1.4, y: 2.95, w: 4.6, h: 1.5, fill: SURFACE, line: LINE });
  s.addText("lib/brm", {
    x: 1.65, y: 3.15, w: 4.1, h: 0.35,
    fontFace: MONO, fontSize: 15, bold: true, color: INK, margin: 0,
  });
  s.addText("cadence · queries · actions", {
    x: 1.65, y: 3.55, w: 4.1, h: 0.3,
    fontFace: SANS, fontSize: 12.5, color: INK2, margin: 0,
  });
  s.addText("Owned by the BRM workstream", {
    x: 1.65, y: 3.9, w: 4.1, h: 0.3,
    fontFace: SANS, fontSize: 11, italic: true, color: MUTED, margin: 0,
  });

  card(s, { x: 7.3, y: 2.95, w: 4.6, h: 1.5, fill: SURFACE, line: LINE });
  s.addText("lib/pm", {
    x: 7.55, y: 3.15, w: 4.1, h: 0.35,
    fontFace: MONO, fontSize: 15, bold: true, color: INK, margin: 0,
  });
  s.addText("health · queries · actions", {
    x: 7.55, y: 3.55, w: 4.1, h: 0.3,
    fontFace: SANS, fontSize: 12.5, color: INK2, margin: 0,
  });
  s.addText("Owned by the PM workstream", {
    x: 7.55, y: 3.9, w: 4.1, h: 0.3,
    fontFace: SANS, fontSize: 11, italic: true, color: MUTED, margin: 0,
  });

  // the forbidden link
  s.addShape(pres.ShapeType.rect, {
    x: 6.0, y: 3.66, w: 1.3, h: 0.06,
    fill: { color: CRIT }, line: { color: CRIT, width: 0 },
  });
  s.addText("NEVER", {
    x: 5.75, y: 3.75, w: 1.8, h: 0.3,
    fontFace: MONO, fontSize: 11, bold: true, color: CRIT, align: "center", margin: 0,
  });

  // schema
  card(s, { x: 1.4, y: 4.95, w: 10.5, h: 0.85, fill: SUNKEN, line: LINE });
  s.addText("prisma/schema.prisma  —  the shared spine", {
    x: 1.4, y: 4.95, w: 10.5, h: 0.85,
    fontFace: MONO, fontSize: 13, bold: true, color: INK,
    align: "center", valign: "middle", margin: 0,
  });

  s.addText(
    "The two modules never import each other. They meet at two nullable foreign keys and nowhere else — so either can be built, tested and demonstrated without the other, and integration is not a cliff at the end of semester.",
    {
      x: M, y: 6.15, w: W - M * 2, h: 0.7,
      fontFace: SANS, fontSize: 13, color: INK2, margin: 0,
    },
  );

  footer(s, "docs/adr/0003-modules-never-import-each-other.md");
  s.addNotes("This is the single most consequential structural decision in the project.");
}

// ═════════════════════════════════════════════════════════════════════════
// 7 — Where your code goes
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("Where your code goes", "For you");

  const ws = [
    ["Shell & shared data", "prisma/ · lib/domain/ · components/shell/"],
    ["BRM module", "lib/brm/ · components/brm/ · app/(app)/relationships/"],
    ["PM module", "lib/pm/ · components/pm/ · app/(app)/projects/"],
    ["UX & design", "app/globals.css · components/ui/ · components/domain/"],
    ["Integration & testing", "lib/dashboard/ · lib/integration/ · tests/ · .github/"],
  ];

  ws.forEach((w, i) => {
    const y = 1.7 + i * 0.86;
    card(s, { x: M, y, w: W - M * 2, h: 0.72, fill: i % 2 ? SURFACE : SUNKEN, line: LINE });
    s.addText(w[0], {
      x: M + 0.35, y: y + 0.19, w: 3.5, h: 0.35,
      fontFace: SANS, fontSize: 14, bold: true, color: INK, margin: 0,
    });
    s.addText(w[1], {
      x: M + 4.0, y: y + 0.21, w: 7.4, h: 0.35,
      fontFace: MONO, fontSize: 12, color: ACCENT, margin: 0,
    });
  });

  card(s, { x: M, y: 6.1, w: W - M * 2, h: 0.72, fill: WARN_SOFT, line: "E0B252" });
  s.addText(
    [
      { text: "Two files touch everyone:  ", options: { bold: true, color: WARN_INK } },
      { text: "prisma/schema.prisma", options: { fontFace: MONO, color: WARN_INK } },
      { text: "  and  ", options: { color: WARN_INK } },
      { text: "lib/domain/enums.ts", options: { fontFace: MONO, color: WARN_INK } },
      { text: ".  Say so in the group chat before you open the PR.", options: { color: WARN_INK } },
    ],
    {
      x: M + 0.35, y: 6.28, w: 11.4, h: 0.4,
      fontFace: SANS, fontSize: 13, margin: 0,
    },
  );

  s.addNotes("Everyone should be able to point at their own directory after this slide.");
}

// ═════════════════════════════════════════════════════════════════════════
// 8 — The three rules
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("Three rules that get a PR rejected", "Before you commit");

  const rules = [
    {
      n: 1,
      t: "Modules never import each other",
      d: "If you need both, it belongs in lib/dashboard. An import across the boundary is visible in review and will be asked about.",
    },
    {
      n: 2,
      t: "Every write checks permission on the server",
      d: "First lines of any action that changes data. Hiding a button is a courtesy — someone who can craft a POST reaches the action anyway.",
    },
    {
      n: 3,
      t: "Derived values are computed, never stored",
      d: "Cadence, progress and risk are pure functions. There is exactly one exception in the codebase, it is documented, and it has its own test suite.",
    },
  ];

  rules.forEach((r, i) => {
    const y = 1.75 + i * 1.6;
    card(s, { x: M, y, w: W - M * 2, h: 1.38, fill: SURFACE, line: LINE });
    disc(s, { x: M + 0.35, y: y + 0.32, n: r.n, tone: "crit" });
    s.addText(r.t, {
      x: M + 1.05, y: y + 0.22, w: 10.5, h: 0.38,
      fontFace: SANS, fontSize: 17, bold: true, color: INK, margin: 0,
    });
    s.addText(r.d, {
      x: M + 1.05, y: y + 0.66, w: 10.5, h: 0.6,
      fontFace: SANS, fontSize: 13, color: INK2, margin: 0,
    });
  });

  s.addText("Full detail, plus the definition of done: CONTRIBUTING.md", {
    x: M, y: 6.7, w: 10, h: 0.3,
    fontFace: SANS, fontSize: 11, color: MUTED, margin: 0,
  });

  s.addNotes("These three are cheap to follow and expensive to unpick later.");
}

// ═════════════════════════════════════════════════════════════════════════
// 9 — Quality
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("What we can actually claim", "Quality");

  const chart = [
    {
      name: "Statement coverage",
      labels: ["Cadence", "Permissions", "Project health", "Everything in lib/"],
      values: [100, 96.6, 95.3, 30.2],
    },
  ];

  s.addChart(pres.ChartType.bar, chart, {
    x: M, y: 1.7, w: 6.6, h: 3.1,
    barDir: "bar",
    showTitle: true,
    title: "Where the tests actually are (%)",
    titleFontFace: SANS, titleFontSize: 13, titleColor: INK,
    chartColors: [ACCENT],
    showValue: true,
    dataLabelPosition: "outEnd",
    dataLabelFontFace: MONO, dataLabelFontSize: 10, dataLabelColor: INK,
    catAxisLabelColor: INK2, catAxisLabelFontFace: SANS, catAxisLabelFontSize: 11,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valAxisMaxVal: 100,
    valGridLine: { color: LINE, size: 1 },
    catGridLine: { style: "none" },
    showLegend: false,
  });

  card(s, { x: M + 7.1, y: 1.7, w: 4.7, h: 3.1, fill: SUNKEN, line: LINE });
  s.addText("THE HONEST FRAMING", {
    x: M + 7.45, y: 1.95, w: 4.0, h: 0.3,
    fontFace: MONO, fontSize: 10, bold: true, color: MUTED, charSpacing: 1, margin: 0,
  });
  s.addText(
    "Overall coverage is 30%. That number is dominated by thin server actions we chose not to test, and the manual script covers them instead.\n\nThe figure that matters is the first three bars: the logic that makes a decision is at or near full coverage.",
    {
      x: M + 7.45, y: 2.3, w: 4.0, h: 2.3,
      fontFace: SANS, fontSize: 12.5, color: INK2, margin: 0,
    },
  );

  const claims = [
    ["WCAG 2.2 AA", "Contrast measured, not eyeballed — zero failures in both modes"],
    ["Legal context", "DDA 1992 makes this the standard with real exposure in Australia"],
    ["Still open", "No screen-reader testing; automated checks find about a third of barriers"],
  ];
  claims.forEach((c, i) => {
    const y = 5.05 + i * 0.6;
    s.addText(c[0], {
      x: M, y, w: 2.5, h: 0.35,
      fontFace: MONO, fontSize: 11, bold: true, color: i === 2 ? CRIT : GOOD, margin: 0,
    });
    s.addText(c[1], {
      x: M + 2.6, y, w: 9.2, h: 0.35,
      fontFace: SANS, fontSize: 13, color: INK2, margin: 0,
    });
  });

  s.addNotes(
    "Never say 'fully tested'. '102 tests, and 26 of 41 manual cases still to run' " +
    "is stronger because a marker can check it.",
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 10 — Open questions for the client
// ═════════════════════════════════════════════════════════════════════════
{
  const s = lightSlide("What we need from the client", "Next");

  s.addText(
    "This was built before the requirements meeting. The relationship model is the part most likely to be wrong, and it is cheap to change now and expensive later.",
    {
      x: M, y: 1.55, w: 11.6, h: 0.5,
      fontFace: SANS, fontSize: 15, color: INK2, margin: 0,
    },
  );

  const qs = [
    "Are six relationship types right? Is there something you maintain that does not fit?",
    "Should one person be able to hold two relationships — an advisor who is also an investor?",
    "What are the real default cadences per type? Ours are reasonable guesses, not observed practice.",
    "Who owns a relationship in practice — one person, or a primary and a backup?",
    "Would the team honestly use the substantive / incidental flag? If not, the cadence figure loses its meaning.",
  ];

  qs.forEach((q, i) => {
    const y = 2.35 + i * 0.82;
    disc(s, { x: M, y: y + 0.02, n: i + 1 });
    s.addText(q, {
      x: M + 0.7, y, w: 11.0, h: 0.6,
      fontFace: SANS, fontSize: 14, color: INK, margin: 0,
    });
  });

  card(s, { x: M, y: 6.45, w: W - M * 2, h: 0.62, fill: ACCENT_SOFT, line: ACCENT });
  s.addText(
    "Showing a working system and asking “is this what you meant?” gets a better answer than a requirements document does.",
    {
      x: M + 0.35, y: 6.58, w: 11.4, h: 0.4,
      fontFace: SANS, fontSize: 13, italic: true, color: ACCENT, margin: 0,
    },
  );

  s.addNotes("Scope document is due 28/08. These five questions are the agenda.");
}

// ═════════════════════════════════════════════════════════════════════════
// 11 — Get started
// ═════════════════════════════════════════════════════════════════════════
{
  const s = darkSlide();

  s.addText("GET IT RUNNING", {
    x: M, y: 0.9, w: 8, h: 0.3,
    fontFace: MONO, fontSize: 12, bold: true, color: "8C8F94", charSpacing: 1.5, margin: 0,
  });
  s.addText("Four commands, no database to install", {
    x: M, y: 1.3, w: 11, h: 0.6,
    fontFace: SANS, fontSize: 34, bold: true, color: "FFFFFF", margin: 0,
  });

  const cmds = [
    "git clone https://github.com/fangyikunJian/viemo-ops-dashboard.git",
    "npm install",
    "npm run setup",
    "npm run dev",
  ];

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 2.25, w: 7.6, h: 2.15,
    fill: { color: "202226" }, line: { color: "34373C", width: 1 }, rectRadius: 0.08,
  });
  cmds.forEach((c, i) => {
    s.addText(c, {
      x: M + 0.35, y: 2.45 + i * 0.46, w: 7.0, h: 0.4,
      fontFace: MONO, fontSize: 11.5, color: i === 0 ? "9FC5F0" : "E4E6EA", margin: 0,
    });
  });

  s.addText("Then sign in with", {
    x: M, y: 4.65, w: 4, h: 0.3,
    fontFace: SANS, fontSize: 13, color: "8C8F94", margin: 0,
  });
  s.addText("admin  /  admin", {
    x: M, y: 4.95, w: 5, h: 0.55,
    fontFace: MONO, fontSize: 26, bold: true, color: "FFFFFF", margin: 0,
  });

  const docs = [
    ["CONTRIBUTING.md", "Rules, conventions, definition of done"],
    ["docs/mvp-scope.md", "What is in, what is out, and why"],
    ["docs/flows.md", "Every flow as a diagram"],
    ["docs/design-system.md", "Tokens and components, Figma-ready"],
    ["docs/demonstration-guide.md", "Script for the client meeting"],
  ];
  s.addText("READ IN THIS ORDER", {
    x: 8.7, y: 2.25, w: 4, h: 0.3,
    fontFace: MONO, fontSize: 10, bold: true, color: "8C8F94", charSpacing: 1, margin: 0,
  });
  docs.forEach((d, i) => {
    const y = 2.62 + i * 0.62;
    s.addText(d[0], {
      x: 8.7, y, w: 4.0, h: 0.28,
      fontFace: MONO, fontSize: 11.5, bold: true, color: "9FC5F0", margin: 0,
    });
    s.addText(d[1], {
      x: 8.7, y: y + 0.26, w: 4.0, h: 0.28,
      fontFace: SANS, fontSize: 11, color: "9DA1A8", margin: 0,
    });
  });

  s.addText(
    "Prototype on synthetic data. Nothing here connects to a live system.",
    {
      x: M, y: H - 0.75, w: 9, h: 0.3,
      fontFace: SANS, fontSize: 11, color: "8C8F94", margin: 0,
    },
  );

  s.addNotes("End here. Everyone should be able to have it running in five minutes.");
}

pres.writeFile({ fileName: "Viemo-UG-S2-28-Team-Briefing.pptx" }).then(() => {
  console.log("written");
});
