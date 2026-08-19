# Compliance and Standards Assessment

**The Viemo Studio Operations Dashboard** · Project UG-S2-28
Assessed 17 August 2026

An honest audit of this system against the standards an Australian business
would be held to, and against ordinary software engineering practice. Written
as an assessment, not a claim: the sections marked **Not met** are the useful
part of the document.

> **Standing caveat.** This system runs entirely on synthetic data and connects
> to nothing. Several obligations below are therefore not yet *engaged* — but
> they engage the moment a single real contact is entered, which is why they
> are assessed now rather than later.

---

## 1. Summary

| Area | Standard | Status |
|---|---|---|
| Accessibility | WCAG 2.2 Level AA (via DDA 1992) | **Partially met** — measured and fixed for contrast, keyboard and structure; not verified with assistive technology |
| Privacy | Privacy Act 1988, Australian Privacy Principles | **Partially met** — APP 11 largely satisfied; APP 1 and APP 5 not addressed |
| Security | ACSC Essential Eight; OWASP basics | **Partially met** — application-layer controls in place; several are organisational, not ours |
| Engineering practice | ADR, CI, testing, documentation | **Met**, with named gaps |
| Records | Audit trail, data retention | **Partially met** — an append-only audit trail exists; no retention policy |

---

## 2. Accessibility — the one with legal teeth

### 2.1 The obligation

Under the **Disability Discrimination Act 1992 (Cth)**, an inaccessible website
or application can constitute unlawful discrimination, and the Act applies to
any organisation developing or hosting web content in Australia — private
sector included, not only government.

In April 2025 the Australian Human Rights Commission issued guidelines
recommending alignment with **WCAG 2.2 Level AA**, and Federal Court decisions
treat WCAG 2 Level AA as the compliance benchmark. Reported exposure runs to
**AUD 100,000**, and the AHRC has signalled a Digital Compliance Sweep in 2026.

This is the standard with the clearest legal consequence of anything in this
document, so it received the most attention.

### 2.2 What was measured, and what was found

Contrast was **computed, not eyeballed**. A script resolved every rendered
text/background pair through a canvas — which handles the `oklch` and `lab`
colour spaces Tailwind v4 emits — and calculated WCAG relative-luminance ratios
across the dashboard, the relationship list and the project list, in both light
and dark mode.

The first run found **six genuine failures**, all in the design tokens:

| Token | Measured | Required | Cause |
|---|---|---|---|
| Muted ink on surface | 3.50:1 | 4.5:1 | Palette's chart-axis grey used for interface text |
| Critical text on its soft tint (light) | 4.13:1 | 4.5:1 | Mark colour used as text |
| Critical text on its soft tint (dark) | 3.66:1 | 4.5:1 | Same, dark surface |
| Good text on its soft tint (light) | 3.00:1 | 4.5:1 | Same |
| Accent as text on its soft tint (light) | 3.91:1 | 4.5:1 | Slot-1 blue too light |
| White on accent — primary buttons | 4.42:1 | 4.5:1 | Same |

The root cause is worth recording, because it is a mistake that is easy to
repeat: the reference palette specifies colours for **chart marks**, and WCAG
holds *text* to a stricter bar than it holds a bar. Applying a validated chart
palette directly to interface text is not the same as being compliant.

Each token was replaced with a measured step from the same ramp, and the status
roles now carry two values — a `-mark` value preserving the palette exactly for
anything drawn, and a text value that clears 4.5:1. Re-measured: **zero
failures across three pages in both modes.**

### 2.3 Checked and passing

| Criterion | Level | Evidence |
|---|---|---|
| 1.3.1 Info and Relationships | A | Semantic landmarks; one `<h1>` per page; no skipped heading levels |
| 1.4.1 Use of Colour | A | Every status carries an icon and a word; colour is never the only cue |
| 1.4.3 Contrast (Minimum) | AA | Measured, above |
| 1.4.11 Non-text Contrast | AA | Form-control borders measured against their backgrounds |
| 2.1.1 Keyboard | A | No pointer-only interaction; the task board uses buttons, not drag-only |
| 2.3.3 Animation from Interactions | AAA | `prefers-reduced-motion` honoured |
| 2.4.1 Bypass Blocks | A | Skip link added — **this was a failure until this audit** |
| 2.4.2 Page Titled | A | Per-route titles via metadata |
| 2.4.7 Focus Visible | AA | Global `:focus-visible` ring |
| 3.1.1 Language of Page | A | `lang="en-AU"` |
| 3.3.1 Error Identification | A | Field-level errors from server validation |
| 3.3.2 Labels or Instructions | A | Every control labelled; audited, zero unlabelled |
| 4.1.2 Name, Role, Value | A | 25 of 25 icons correctly hidden from assistive technology |

### 2.4 Not met

- **No assistive-technology testing.** Nothing here was verified with NVDA,
  JAWS or VoiceOver. Automated checks find perhaps a third of real barriers.
  This is the single largest gap in the accessibility claim.
- **Reflow (1.4.10) and text spacing (1.4.12)** at 400% zoom not verified.
- **Target size (2.5.8, new in WCAG 2.2)** not measured. Some task-board
  controls are visibly below 24×24 CSS pixels and probably fail.
- **Focus appearance (2.4.11, new in 2.2)** not measured against its contrast
  requirement.

**Recommendation:** before the system is used by anyone outside the team, run a
screen-reader pass over the sign-in, dashboard and relationship-detail screens,
and enlarge the task-board controls.

---

## 3. Privacy — Privacy Act 1988 and the APPs

### 3.1 Does it apply?

The Privacy Act binds Australian Government agencies and organisations with an
**annual turnover above AUD 3 million**, plus certain others. An early-stage
venture studio is likely below that threshold and therefore not an APP entity
today.

**That is a reason to design to the APPs anyway, not a reason to ignore them.**
The threshold is turnover, not conduct: a business that crosses it inherits its
existing systems. Building to the standard now costs little; retrofitting it
across a live relationship database costs a great deal. The client should also
know that reforms have been progressively tightening these obligations, with
automated decision-making transparency requirements commencing **10 December
2026**.

### 3.2 Assessment against the APPs

| APP | Requirement | Status |
|---|---|---|
| **APP 1** — Open and transparent management | A clearly expressed, up-to-date privacy policy | **Not met.** No privacy notice exists in the application. |
| **APP 3** — Collection of solicited information | Collect only what is reasonably necessary | **Met.** Name, role, email, phone. No date of birth, no address, no identifiers beyond what a contact record needs. |
| **APP 5** — Notification of collection | Tell people their information is being collected and why | **Not met, and materially so.** The people recorded in this system are third parties who never visit it. This is the hardest APP for any CRM-shaped product and it needs a client decision, not a technical one. |
| **APP 6** — Use and disclosure | Use only for the purpose collected | **Met by design.** No third-party analytics, no external calls, no telemetry. The JSON export is administrator-only and deliberate. |
| **APP 8** — Cross-border disclosure | Restrictions on sending offshore | **Met today.** Runs locally with no external egress. Would engage on deployment to an offshore host — a hosting decision to make consciously. |
| **APP 10** — Quality | Accurate, up to date, complete | **Partially met.** Validation on every write; `updatedAt` on every record. No review or correction workflow. |
| **APP 11** — Security | Reasonable steps to protect information | **Largely met.** See §4. An audit trail now records who changed what and when. |
| **APP 12** — Access | Give a person access to their information on request | **Not met.** No mechanism to export what is held about one individual. |
| **APP 13** — Correction | Correct information on request | **Partially met.** Records are editable by a member, but there is no request-and-response process. |

### 3.3 The one to raise with the client

**APP 5.** A BRM stores personal information about people who are not users and
who have not been told. Under a strict reading, an advisor whose contact details
and interaction history are recorded should be notified. In practice most
businesses handle this through a privacy policy plus a line in first contact.

It is a business-process decision, not a feature, and it belongs on the agenda
for the client meeting rather than in a backlog.

---

## 4. Security

### 4.1 ACSC Essential Eight

The Essential Eight is the ASD/ACSC baseline, and **Maturity Level 1 is the
expected floor for Australian SMEs in 2026**, increasingly checked during
procurement, vendor risk assessment and cyber-insurance underwriting.

Most of the eight are organisational IT controls rather than application
controls. Assessed for what an application can contribute:

| Control | Applicability | Status |
|---|---|---|
| Application control | Organisational | Out of scope |
| Patch applications | Shared | **Partially met** — dependencies pinned via lockfile; no automated vulnerability scanning |
| Configure Office macros | Organisational | Not applicable |
| User application hardening | Shared | **Partially met** — security response headers set; no Content-Security-Policy (see below) |
| Restrict administrative privileges | **Application** | **Met** — three roles, least privilege by default, deletion and account management restricted to administrators, last-admin lockout prevented |
| Patch operating systems | Organisational | Out of scope |
| Multi-factor authentication | **Application** | **Not met** — single factor only |
| Regular backups | Organisational | **Not met** — no backup procedure defined |

### 4.2 Application-layer controls in place

- **Password storage** — scrypt, per-password salt, constant-time comparison
- **Session tokens** — 256 bits of `randomBytes`, not the schema's sequential
  cuid; database-backed with expiry; invalidated on deactivation
- **Authorisation** — checked server-side inside every write, before input is
  read; route guards and hidden controls are secondary
- **Rate limiting** — sign-in throttled to 8 attempts per 15 minutes per
  address, keyed by email rather than IP so one person cannot lock out an office
- **No account enumeration** — a wrong password and an unknown address return
  the same message
- **Input validation** — Zod on every write, server-side
- **SQL injection** — not reachable; Prisma parameterises, and no raw SQL exists
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`
- **Error handling** — no stack traces or database messages reach the browser
- **Secrets** — none in the repository; `.env` is gitignored

### 4.3 Not met

- **No multi-factor authentication.** The clearest Essential Eight gap.
- **No Content-Security-Policy.** Next.js injects inline scripts for hydration,
  so a useful CSP requires per-request nonces through middleware. A CSP with
  `unsafe-inline` would be decoration, so none was shipped. Documented rather
  than faked.
- **Rate limiting is per-process and in memory.** Correct for one instance;
  needs a shared store behind more than one.
- **No dependency vulnerability scanning** in CI. `npm audit` reported zero at
  install time, but nothing watches it.
- **No penetration testing.**

---

## 5. Engineering practice

### 5.1 Met

| Practice | Evidence |
|---|---|
| Version control with meaningful history | Commits explain *why*, not what |
| Continuous integration | GitHub Actions: typecheck, lint, test, build, seed on every push and PR |
| Automated testing | 94 tests; unit plus integration against a real database |
| Architecture decision records | `docs/adr/`, Nygard format |
| Architecture documentation | Structure, data model, boundaries, trade-offs, limitations |
| Static analysis | TypeScript strict mode, ESLint, zero warnings |
| Reproducible setup | One command; Node version pinned; no external services |
| Documented API surface | Integration port typed and tested |
| Onboarding documentation | Team handbook with rules, conventions and definition of done |

The documentation set follows the widely used pattern of **ADRs in Nygard
format** for decisions plus a structured architecture document, which is the
approach arc42 and the C4 model both recommend.

### 5.2 Not met

- **No deployment pipeline.** CI verifies; nothing deploys.
- **No structured logging or monitoring.** `console.error` is the extent of it.
- **No performance testing.** Lists load everything; the ceiling is unmeasured.
- **No cross-browser matrix.** Chromium only.
- **No data retention or deletion policy.** Archived records are kept forever
  by design; nobody has decided whether that is right.

---

## 6. Localisation

| Convention | Status |
|---|---|
| Australian English | **Met** — `organisation`, not `organization`, throughout code and interface |
| Date format | **Met** — `17 Aug 2026` via `Intl.DateTimeFormat("en-AU")`, centralised in `lib/format.ts` |
| Language declaration | **Met** — `lang="en-AU"` |
| Time zone handling | **Partially met** — dates are stored as UTC and rendered in the browser's zone. Correct for a single-country team; would need attention for a distributed one. |
| Currency | Not applicable — the system holds no monetary values |

---

## 7. Priorities

In the order they would pay off, with the reasoning:

1. **Screen-reader pass and target-size fixes.** Accessibility is the obligation
   with real legal exposure in Australia, and it is the one where automated
   checking is least sufficient.
3. **Privacy notice and an APP 5 position.** A client decision. Raise it at the
   requirements meeting.
4. **Multi-factor authentication.** The clearest Essential Eight gap.
5. **CSP with nonces via middleware.** Real rather than decorative.
6. **Dependency scanning in CI.** One workflow step.
7. **Backup and retention policy.** Needs the client to say how long records
   should be kept.

---

## Sources

- [Australian Privacy Principles guidelines — OAIC](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines)
- [Privacy Act 1988 — Federal Register of Legislation](https://www.legislation.gov.au/C2004A03712/latest)
- [Privacy — Attorney-General's Department](https://www.ag.gov.au/rights-and-protections/privacy)
- [Australian Privacy Law Update: what APP entities need to know in 2026 — Landers](https://landers.com.au/legal-insights-news/australian-privacy-law-update-what-app-entities-need-to-know-in-2026)
- [World Wide Web Access: Disability Discrimination Act Advisory Notes — Australian Human Rights Commission](https://humanrights.gov.au/our-work/disability-rights/world-wide-web-access-disability-discrimination-act-advisory-notes-ver)
- [Australia's accessibility laws — Deque](https://www.deque.com/apac-digital-accessibility-laws/australia/)
- [Australia Disability Discrimination Act (DDA) 2026: WCAG 2.2 compliance guide — AEL Data](https://aeldata.com/australia-disability-discrimination-act-dda/)
- [ASD Essential Eight Maturity Model guide — Matrix Solutions](https://www.matrixsolutions.com.au/essential-eight-maturity-model-guide/)
- [ACSC Essential Eight in 2026 — Touchpoint Technology](https://www.touchpoint.com.au/resources/insights/acsc-essential-eight-2026/)
- [Architecture Decision Records — arc42](https://docs.arc42.org/section-9/)
- [Architecture decision record examples — joelparkerhenderson](https://github.com/architecture-decision-record/architecture-decision-record)

---

## Appendix — checking a colour pair yourself

Paste into the browser console on any screen. It resolves every rendered
text/background pair and reports anything below its WCAG threshold.

```js
(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const rgb = c => { ctx.clearRect(0,0,1,1); ctx.fillStyle='#000'; ctx.fillStyle=c;
    ctx.fillRect(0,0,1,1); const d = ctx.getImageData(0,0,1,1).data;
    return [d[0], d[1], d[2], d[3]/255]; };
  const lum = ([r,g,b]) => { const c=[r,g,b].map(v => { v/=255;
    return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; };
  const ratio = (f,b) => { const a=Math.max(lum(f),lum(b)), m=Math.min(lum(f),lum(b));
    return (a+0.05)/(m+0.05); };
  const bgOf = el => { let n=el; while (n && n!==document.documentElement) {
    const c=rgb(getComputedStyle(n).backgroundColor);
    if (c[3]>0.95) return c.slice(0,3); n=n.parentElement; } return [255,255,255]; };

  const fails=[], seen=new Set();
  document.querySelectorAll('p,span,a,h1,h2,h3,td,th,li,button,label,div,dt,dd')
    .forEach(el => {
      const txt=(el.textContent||'').trim();
      if (!txt || el.children.length || el.closest('[aria-hidden="true"]')) return;
      const cs=getComputedStyle(el);
      if (cs.visibility==='hidden' || cs.display==='none') return;
      const fg=rgb(cs.color).slice(0,3), bg=bgOf(el);
      const size=parseFloat(cs.fontSize), weight=parseInt(cs.fontWeight)||400;
      const need=(size>=24 || (size>=18.66 && weight>=700)) ? 3 : 4.5;
      const key=fg.join()+'|'+bg.join()+'|'+Math.round(size)+'|'+weight;
      if (seen.has(key)) return; seen.add(key);
      const r=ratio(fg,bg);
      if (r<need) fails.push({ text: txt.slice(0,34), ratio:+r.toFixed(2), need, size });
    });
  console.table(fails);
  return { combosChecked: seen.size, failures: fails.length };
})()
```
