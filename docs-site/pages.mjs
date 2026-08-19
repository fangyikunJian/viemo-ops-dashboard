/**
 * The page list, and the order it appears in the sidebar.
 *
 * `source` is relative to the repository root, so the markdown in the repo
 * stays the single source of truth. Editing a document and pushing rebuilds
 * the site — there is no second copy of the content to keep in step.
 */

export const SECTIONS = [
  {
    label: "Start here",
    pages: [
      {
        slug: "index",
        source: null, // hand-built overview, see overview.mjs
        title: "Overview",
        blurb: "What this is, in one screen",
      },
      {
        slug: "handbook",
        source: "CONTRIBUTING.md",
        title: "Team handbook",
        blurb: "Setup, the three rules, where things go",
      },
      {
        slug: "readme",
        source: "README.md",
        title: "Repository README",
        blurb: "Commands, stack, layout",
      },
    ],
  },
  {
    label: "The product",
    pages: [
      {
        slug: "mvp-scope",
        source: "docs/mvp-scope.md",
        title: "MVP scope",
        blurb: "What is in, what is out, and why",
      },
      {
        slug: "brm-taxonomy",
        source: "docs/brm-taxonomy.md",
        title: "BRM taxonomy",
        blurb: "Every term defined; how it differs from a CRM",
      },
      {
        slug: "client-alignment",
        source: "docs/client-alignment.md",
        title: "Client alignment",
        blurb: "Where the brief and the client's vision diverge, and what to ask",
      },
      {
        slug: "user-guide",
        source: "docs/user-guide.md",
        title: "User guide",
        blurb: "How to use the delivered application",
      },
    ],
  },
  {
    label: "How it is built",
    pages: [
      {
        slug: "architecture",
        source: "docs/design-and-architecture.md",
        title: "Design and architecture",
        blurb: "Data model, boundaries, trade-offs",
      },
      {
        slug: "flows",
        source: "docs/flows.md",
        title: "Flow diagrams",
        blurb: "Eight diagrams: IA, the loop, cadence, risk, auth, the model",
      },
      {
        slug: "design-system",
        source: "docs/design-system.md",
        title: "Design system",
        blurb: "Tokens, type, components — the Figma and framework layers",
      },
      {
        slug: "tokens",
        source: null, // hand-built live specimen, see tokens.mjs
        title: "Live tokens",
        blurb: "The actual colours and type, rendered",
      },
    ],
  },
  {
    label: "Decisions",
    pages: [
      { slug: "adr", source: "docs/adr/README.md", title: "Decision records", blurb: "Index of nine ADRs" },
      { slug: "adr-0001", source: "docs/adr/0001-relationship-as-first-class-entity.md", title: "ADR-0001 · Relationship first" },
      { slug: "adr-0002", source: "docs/adr/0002-derive-values-rather-than-store-them.md", title: "ADR-0002 · Derive, don't store" },
      { slug: "adr-0003", source: "docs/adr/0003-modules-never-import-each-other.md", title: "ADR-0003 · Module boundary" },
      { slug: "adr-0004", source: "docs/adr/0004-vocabulary-in-one-typescript-module.md", title: "ADR-0004 · One vocabulary" },
      { slug: "adr-0005", source: "docs/adr/0005-nextjs-prisma-sqlite.md", title: "ADR-0005 · The stack" },
      { slug: "adr-0006", source: "docs/adr/0006-authorise-inside-server-actions.md", title: "ADR-0006 · Authorisation" },
      { slug: "adr-0007", source: "docs/adr/0007-integration-port-not-live-connection.md", title: "ADR-0007 · Integration port" },
      { slug: "adr-0008", source: "docs/adr/0008-step-palette-colours-for-contrast.md", title: "ADR-0008 · Contrast" },
      { slug: "adr-0009", source: "docs/adr/0009-postgres-not-sqlite.md", title: "ADR-0009 · Postgres" },
    ],
  },
  {
    label: "Quality",
    pages: [
      {
        slug: "test-plan",
        source: "docs/test-plan.md",
        title: "Test plan and results",
        blurb: "What is covered, what is not, what still needs running",
      },
      {
        slug: "compliance",
        source: "docs/compliance-and-standards.md",
        title: "Compliance",
        blurb: "WCAG 2.2 AA, Privacy Act, Essential Eight — including what is not met",
      },
      {
        slug: "deployment",
        source: "docs/deployment.md",
        title: "Deployment",
        blurb: "Vercel, Supabase and Pages — and what not to deploy where",
      },
      {
        slug: "demonstration",
        source: "docs/demonstration-guide.md",
        title: "Demonstration guide",
        blurb: "Scripted walkthrough for the client meeting",
      },
    ],
  },
];

/** Maps a repository-relative markdown path to the slug it renders as. */
export const SOURCE_TO_SLUG = new Map(
  SECTIONS.flatMap((s) => s.pages)
    .filter((p) => p.source)
    .map((p) => [p.source, p.slug]),
);

export const ALL_PAGES = SECTIONS.flatMap((s) => s.pages);
