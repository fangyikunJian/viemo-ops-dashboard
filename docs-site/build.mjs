/**
 * Documentation site generator.
 *
 * Turns the repository's markdown into a static site. The markdown stays the
 * single source of truth — there is no second copy of the content to keep in
 * step, so a document edited in a pull request is the document the site shows.
 *
 *   node docs-site/build.mjs [outputDir]
 *
 * Output is fully static: it runs on GitHub Pages, under Apache, or from a
 * file:// URL. Mermaid is the only script, and it renders diagrams client-side.
 */

import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import GithubSlugger from "github-slugger";

import { SECTIONS, ALL_PAGES, SOURCE_TO_SLUG } from "./pages.mjs";
import { renderOverview } from "./overview.mjs";
import { renderTokens } from "./tokens.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT = path.resolve(ROOT, process.argv[2] ?? "docs-site/dist");

// ═══════════════════════════════════════════════════════════════════
//  Markdown
// ═══════════════════════════════════════════════════════════════════

/**
 * Rewrite a link that points at a markdown file in the repository so it points
 * at the page this site renders it as. Anything not in the manifest is left
 * alone and sent to GitHub, so a link to source code still works.
 */
function rewriteLink(href, sourceDir) {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href;

  const [file, hash = ""] = href.split("#");
  if (!file) return href;

  const resolved = path
    .normalize(path.join(sourceDir, file))
    .replace(/\\/g, "/");

  const slug = SOURCE_TO_SLUG.get(resolved);
  if (slug) return `${slug === "index" ? "." : slug + ".html"}${hash ? "#" + hash : ""}`;

  // Not a documented page — point at the file on GitHub.
  return `https://github.com/fangyikunJian/viemo-ops-dashboard/blob/main/${resolved}${hash ? "#" + hash : ""}`;
}

/**
 * Per-document state for the renderer.
 *
 * marked v16 and later only honour a renderer registered through `marked.use`,
 * which is global rather than per-call — passing one in the options object is
 * silently ignored, which is how the ADR index shipped with unrewritten `.md`
 * links the first time. The build is sequential, so a module-level box set
 * before each parse is safe and keeps the renderer able to see which file it
 * is rendering.
 */
const state = { sourceDir: ".", slugger: new GithubSlugger(), headings: [] };

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const plain = tokens
        .map((t) => t.raw ?? "")
        .join("")
        .replace(/[*_`[\]]/g, "")
        .trim();
      const id = state.slugger.slug(plain);
      if (depth === 2 || depth === 3) state.headings.push({ depth, id, text: plain });
      return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${depth}>\n`;
    },

    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const target = rewriteLink(href, state.sourceDir);
      const external = /^https?:/.test(target);
      return `<a href="${target}"${title ? ` title="${escapeHtml(title)}"` : ""}${
        external ? ' target="_blank" rel="noreferrer noopener"' : ""
      }>${text}</a>`;
    },

    // Mermaid fences become a <pre class="mermaid"> the client script picks up.
    code({ text, lang }) {
      if (lang === "mermaid") return `<pre class="mermaid">${escapeHtml(text)}</pre>`;
      const cls = lang ? ` class="language-${lang}"` : "";
      return `<pre><code${cls}>${escapeHtml(text)}</code></pre>`;
    },

    table({ header, rows }) {
      const head = header
        .map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`)
        .join("");
      const body = rows
        .map(
          (row) =>
            `<tr>${row.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`,
        )
        .join("");
      return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    },
  },
});

function renderMarkdown(markdown, sourcePath) {
  state.sourceDir = path.dirname(sourcePath ?? ".");
  state.slugger = new GithubSlugger();
  state.headings = [];

  const html = marked.parse(markdown);
  return { html, headings: [...state.headings] };
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════════
//  Shell
// ═══════════════════════════════════════════════════════════════════

function nav(currentSlug) {
  return SECTIONS.map(
    (section) => `
      <div class="nav-group">
        <p class="eyebrow">${section.label}</p>
        <ul>
          ${section.pages
            .map(
              (p) => `<li><a href="${p.slug === "index" ? "." : p.slug + ".html"}"${
                p.slug === currentSlug ? ' class="current" aria-current="page"' : ""
              }>${p.title}</a></li>`,
            )
            .join("")}
        </ul>
      </div>`,
  ).join("");
}

function onThisPage(headings) {
  const h2s = headings.filter((h) => h.depth === 2);
  if (h2s.length < 3) return "";
  return `
    <nav class="toc" aria-label="On this page">
      <p class="eyebrow">On this page</p>
      <ul>${h2s.map((h) => `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join("")}</ul>
    </nav>`;
}

function shell({ title, slug, body, headings = [], wide = false }) {
  const isHome = slug === "index";
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Viemo Studio Operations Docs</title>
<meta name="description" content="Architecture, design and process documentation for the Viemo Studio Operations Dashboard, project UG-S2-28.">
<link rel="stylesheet" href="styles.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%23256abf'/><text x='16' y='23' font-family='monospace' font-size='19' font-weight='700' fill='white' text-anchor='middle'>V</text></svg>">
</head>
<body>
<a href="#content" class="skip-link">Skip to main content</a>

<header class="topbar">
  <a class="brand" href=".">
    <span class="mark" aria-hidden="true">V</span>
    <span>
      <strong>Viemo Studio Operations</strong>
      <span class="brand-sub">Project documentation · UG-S2-28</span>
    </span>
  </a>
  <div class="topbar-actions">
    <a href="https://github.com/fangyikunJian/viemo-ops-dashboard" target="_blank" rel="noreferrer noopener">GitHub</a>
  </div>
</header>

<div class="layout${wide ? " layout-wide" : ""}">
  <nav class="sidebar" aria-label="Documentation">
    ${nav(slug)}
  </nav>

  <main id="content" tabindex="-1" class="content${isHome ? " content-home" : ""}">
    ${body}
    <footer class="page-footer">
      <p>Synthetic data throughout. This system holds no real relationship, contact or project information and connects to no live system.</p>
      <p>Generated from the repository's markdown by <code>docs-site/build.mjs</code>. Edit the source document, not this page.</p>
    </footer>
  </main>

  ${isHome ? "" : onThisPage(headings)}
</div>

<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  mermaid.initialize({
    startOnLoad: true,
    theme: dark ? "dark" : "base",
    fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
    themeVariables: dark
      ? { primaryColor: "#16283c", primaryTextColor: "#ffffff", primaryBorderColor: "#6da7ec",
          lineColor: "#898781", secondaryColor: "#1a1a19", tertiaryColor: "#131312" }
      : { primaryColor: "#eaf2fd", primaryTextColor: "#0b0b0b", primaryBorderColor: "#256abf",
          lineColor: "#6e6c66", secondaryColor: "#fcfcfb", tertiaryColor: "#f2f1ed" },
  });
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
//  Build
// ═══════════════════════════════════════════════════════════════════

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  await cp(path.join(HERE, "styles.css"), path.join(OUT, "styles.css"));

  // GitHub Pages otherwise runs the output through Jekyll, which drops files
  // and directories beginning with an underscore.
  await writeFile(path.join(OUT, ".nojekyll"), "");

  let built = 0;

  for (const page of ALL_PAGES) {
    let body;
    let headings = [];
    let wide = false;

    if (page.slug === "index") {
      body = renderOverview(SECTIONS);
      wide = true;
    } else if (page.slug === "tokens") {
      body = renderTokens();
      wide = true;
    } else {
      const abs = path.join(ROOT, page.source);
      if (!existsSync(abs)) {
        console.warn(`  ! missing source: ${page.source}`);
        continue;
      }
      const md = await readFile(abs, "utf8");
      const rendered = renderMarkdown(md, page.source);
      body = `<article class="prose">${rendered.html}</article>`;
      headings = rendered.headings;
    }

    const file = page.slug === "index" ? "index.html" : `${page.slug}.html`;
    await writeFile(
      path.join(OUT, file),
      shell({ title: page.title, slug: page.slug, body, headings, wide }),
    );
    built++;
  }

  console.log(`Built ${built} pages into ${path.relative(ROOT, OUT)}`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
