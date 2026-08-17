/**
 * The documentation home page.
 *
 * Hand-built rather than generated from a markdown file, because the job of
 * this page is orientation, not prose: someone arriving cold should know what
 * the project is and where to go next without scrolling.
 */

export function renderOverview(sections) {
  const stats = [
    ["102", "tests passing"],
    ["23", "relationships"],
    ["10", "projects"],
    ["8", "decision records"],
  ];

  const layers = [
    {
      n: "01",
      title: "Dashboard shell",
      body: "Navigation and a home screen that answers one question: does today need me?",
    },
    {
      n: "02",
      title: "BRM module",
      body: "Business Relationship Management — a broader alternative to a CRM. Advisors, investors, partners, institutions, suppliers and customers, each maintained to its own agreed rhythm.",
    },
    {
      n: "03",
      title: "Project Management module",
      body: "Projects, tasks, owners, statuses and deadlines. Progress and risk are derived from the work rather than typed in.",
    },
  ];

  const starts = [
    {
      href: "handbook.html",
      label: "I am joining the team",
      body: "Setup, the three architectural rules, where each kind of change goes, and the definition of done.",
    },
    {
      href: "flows.html",
      label: "I want to see how it works",
      body: "Eight diagrams: information architecture, the core loop, cadence, project risk, authorisation and the data model.",
    },
    {
      href: "architecture.html",
      label: "I want to know why it is built this way",
      body: "The data model, module boundaries and the trade-offs behind them — plus eight decision records.",
    },
    {
      href: "demonstration.html",
      label: "I am presenting it",
      body: "A scripted walkthrough: what to run beforehand, what to say at each screen, and what to do when the machine misbehaves.",
    },
  ];

  return `
<div class="hero">
  <p class="eyebrow">University of Adelaide ICT Capstone · Project UG-S2-28 · Semester 2 2026</p>
  <h1>A venture studio's relationships and its project work, in one operational picture.</h1>
  <p class="lede">
    A CRM organises around a deal moving toward a close. Half the relationships
    that decide whether a studio succeeds are never going to buy anything — and
    a CRM has nowhere to put them. This is the documentation for the system
    built to fix that.
  </p>

  <div class="stat-row">
    ${stats
      .map(
        ([v, l]) => `
      <div class="stat">
        <span class="stat-value">${v}</span>
        <span class="stat-label">${l}</span>
      </div>`,
      )
      .join("")}
  </div>
</div>

<section class="block">
  <p class="eyebrow">What it is</p>
  <h2 class="block-title">Three layers on one shared data model</h2>
  <div class="layer-list">
    ${layers
      .map(
        (l) => `
      <div class="layer">
        <span class="layer-n">${l.n}</span>
        <div>
          <h3>${l.title}</h3>
          <p>${l.body}</p>
        </div>
      </div>`,
      )
      .join("")}
  </div>
  <p class="note">
    The two modules never import each other. They meet at exactly two nullable
    foreign keys, which is what lets five people build them in parallel and what
    keeps integration from being a cliff at the end of semester.
  </p>
</section>

<section class="block">
  <p class="eyebrow">Where to start</p>
  <h2 class="block-title">Pick the one that sounds like you</h2>
  <div class="card-grid">
    ${starts
      .map(
        (s) => `
      <a class="start-card" href="${s.href}">
        <h3>${s.label}</h3>
        <p>${s.body}</p>
        <span class="start-go">Read →</span>
      </a>`,
      )
      .join("")}
  </div>
</section>

<section class="block">
  <p class="eyebrow">Everything</p>
  <h2 class="block-title">The full set</h2>
  <div class="index-grid">
    ${sections
      .map(
        (section) => `
      <div class="index-col">
        <p class="index-label">${section.label}</p>
        <ul>
          ${section.pages
            .filter((p) => p.slug !== "index")
            .map(
              (p) => `<li>
                <a href="${p.slug}.html">${p.title}</a>
                ${p.blurb ? `<span>${p.blurb}</span>` : ""}
              </li>`,
            )
            .join("")}
        </ul>
      </div>`,
      )
      .join("")}
  </div>
</section>

<section class="block callout">
  <p class="eyebrow">Status</p>
  <h2 class="block-title">A prototype, and honest about it</h2>
  <p>
    The core is complete and verified: 102 automated tests, continuous
    integration green, zero measured accessibility contrast failures. It is not
    a production system — there is no multi-factor authentication, no audit
    trail, no backups and no assistive-technology verification, and 26 of 41
    manual test cases have not been run.
  </p>
  <p>
    All of that is itemised in
    <a href="compliance.html">the compliance assessment</a> and
    <a href="test-plan.html">the test plan</a> rather than left to be
    discovered. Saying “the core is complete, and here is what is not” is a
    stronger claim than “it is finished”, because it can be checked.
  </p>
</section>`;
}
