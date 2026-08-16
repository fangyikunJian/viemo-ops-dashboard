/**
 * Synthetic data for The Viemo Studio Operations Dashboard.
 *
 * Every record here is invented. The project brief specifies synthetic data and
 * no connection to live or confidential systems, so nothing in this file is
 * drawn from a real relationship, contact or project.
 *
 * The data is shaped rather than random. Each relationship declares how long it
 * has been since it was last contacted, so the seeded database reliably
 * produces a dashboard with a known story: a handful of overdue relationships,
 * a few due soon, two projects at risk. A purely random seed would sometimes
 * produce a dashboard with nothing on it, which is useless for a demonstration
 * and useless for testing.
 *
 * Run with `npm run db:seed`.
 */

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../lib/auth/password";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const NOW = new Date();

function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
}

function daysAhead(n: number): Date {
  return daysAgo(-n);
}

/**
 * Deterministic pseudo-random numbers, so re-seeding produces the same database
 * and a bug found during testing can be reproduced.
 */
function makeRandom(seed: number) {
  let state = seed;
  return function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom(20260817);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

// ═══════════════════════════════════════════════════════════════════
//  Team
// ═══════════════════════════════════════════════════════════════════

const TEAM = [
  { key: "avery", name: "Avery Nakamura", title: "Studio Director" },
  { key: "priya", name: "Priya Raghunathan", title: "Venture Partner" },
  { key: "tom", name: "Tom Whitlock", title: "Head of Delivery" },
  { key: "shan", name: "Shanice Boateng", title: "Product Lead" },
  { key: "dmitri", name: "Dmitri Volkov", title: "Technical Lead" },
  { key: "elena", name: "Elena Fitzgerald", title: "Operations Manager" },
] as const;

type TeamKey = (typeof TEAM)[number]["key"];

const ACCOUNTS = [
  {
    // Deliberately trivial, for demonstrations and for reviewers who should not
    // have to copy a long string off a screen. It bypasses the normal password
    // rules because the seed hashes directly rather than going through
    // validatePassword. Listed first in the README's "remove before real data"
    // note for the same reason it exists: it is not a real credential.
    email: "admin",
    password: "admin",
    role: "ADMIN",
    member: "avery" as TeamKey,
  },
  {
    email: "admin@viemostudio.example",
    password: "viemo-admin-2026",
    role: "ADMIN",
    member: "priya" as TeamKey,
  },
  {
    email: "member@viemostudio.example",
    password: "viemo-member-2026",
    role: "MEMBER",
    member: "tom" as TeamKey,
  },
  {
    email: "viewer@viemostudio.example",
    password: "viemo-viewer-2026",
    role: "VIEWER",
    member: "elena" as TeamKey,
  },
] as const;

// ═══════════════════════════════════════════════════════════════════
//  Organisations
// ═══════════════════════════════════════════════════════════════════

const ORGANISATIONS = [
  { key: "lumen", name: "Lumen Ventures", website: "https://lumen.example" },
  { key: "torrens", name: "Torrens Angel Collective", website: null },
  { key: "adelaide-uni", name: "University of Adelaide", website: null },
  { key: "saic", name: "SA Innovation Commission", website: null },
  { key: "northgate", name: "Northgate Digital", website: null },
  { key: "harbourline", name: "Harbourline Studios", website: null },
  { key: "meridian", name: "Meridian Legal", website: null },
  { key: "cobalt", name: "Cobalt Cloud Services", website: null },
  { key: "brightpath", name: "Brightpath Health", website: null },
] as const;

type OrgKey = (typeof ORGANISATIONS)[number]["key"];

// ═══════════════════════════════════════════════════════════════════
//  Relationships
//
//  `lastContactDaysAgo` drives the cadence status each record will show:
//    null                        never contacted
//    > cadenceDays               OVERDUE
//    within the last fifth       DUE_SOON
//    anything earlier            ON_TRACK
// ═══════════════════════════════════════════════════════════════════

type RelationshipSeed = {
  key: string;
  name: string;
  type: string;
  status: string;
  cadenceDays: number | null;
  lastContactDaysAgo: number | null;
  owner: TeamKey;
  org: OrgKey | null;
  valueToUs: string | null;
  valueToThem: string | null;
  notes?: string;
  contacts?: { name: string; role: string; email: string; isPrimary?: boolean }[];
  tags?: string[];
};

const RELATIONSHIPS: RelationshipSeed[] = [
  // ── Advisors ────────────────────────────────────────────────────
  {
    key: "sarah-chen",
    name: "Dr Sarah Chen",
    type: "ADVISOR",
    status: "ACTIVE",
    cadenceDays: 30,
    lastContactDaysAgo: 47, // OVERDUE by 17
    owner: "avery",
    org: null,
    valueToUs: "Clinical validation and health-sector introductions",
    valueToThem: "Early sight of health ventures; advisory equity in Brightpath pilot",
    notes:
      "Prefers a short call to a long email. Has offered to review any clinical claims before they go public.",
    contacts: [
      {
        name: "Dr Sarah Chen",
        role: "Independent advisor",
        email: "s.chen@example.org",
        isPrimary: true,
      },
    ],
    tags: ["health", "advisory-board"],
  },
  {
    key: "marcus-oyelaran",
    name: "Marcus Oyelaran",
    type: "ADVISOR",
    status: "ACTIVE",
    cadenceDays: 90,
    lastContactDaysAgo: 12,
    owner: "priya",
    org: null,
    valueToUs: "Go-to-market judgement, particularly on pricing",
    valueToThem: "Deal flow visibility; keeps his hand in operating problems",
    contacts: [
      {
        name: "Marcus Oyelaran",
        role: "Independent advisor",
        email: "marcus@example.org",
        isPrimary: true,
      },
    ],
    tags: ["go-to-market"],
  },
  {
    key: "hana-lindqvist",
    name: "Hana Lindqvist",
    type: "ADVISOR",
    status: "DORMANT",
    cadenceDays: 90,
    lastContactDaysAgo: 210, // dormant, so NOT_TRACKED despite the gap
    owner: "avery",
    org: null,
    valueToUs: "Design leadership; ran the studio's first brand sprint",
    valueToThem: "Portfolio work and referrals",
    notes:
      "On parental leave until March. Agreed to pause contact rather than let it lapse — revisit then.",
    tags: ["design"],
  },

  {
    key: "wendy-okafor",
    name: "Wendy Okafor",
    type: "ADVISOR",
    status: "ACTIVE",
    cadenceDays: 60,
    lastContactDaysAgo: 22,
    owner: "elena",
    org: null,
    valueToUs: "Operations and hiring; has scaled two teams through this stage",
    valueToThem: "Stays close to early-stage practice between board roles",
    contacts: [
      {
        name: "Wendy Okafor",
        role: "Independent advisor",
        email: "wendy@example.org",
        isPrimary: true,
      },
    ],
    tags: ["operations"],
  },
  {
    key: "raj-balakrishnan",
    name: "Raj Balakrishnan",
    type: "ADVISOR",
    status: "ACTIVE",
    cadenceDays: 182,
    lastContactDaysAgo: 96,
    owner: "dmitri",
    org: null,
    valueToUs: "Technical architecture review at decision points",
    valueToThem: "Interesting problems; first look at technical hires",
    notes: "Twice a year is enough. Prefers a written brief a week ahead.",
    tags: ["engineering"],
  },

  // ── Investors ───────────────────────────────────────────────────
  {
    key: "lumen",
    name: "Lumen Ventures",
    type: "INVESTOR",
    status: "ACTIVE",
    cadenceDays: 30,
    lastContactDaysAgo: 26, // DUE_SOON
    owner: "avery",
    org: "lumen",
    valueToUs: "Lead investor in the studio vehicle; follow-on capacity",
    valueToThem: "Proprietary deal flow at formation stage",
    notes:
      "Quarterly written update is expected by the 5th. Priya handles the numbers, Avery the narrative.",
    contacts: [
      {
        name: "Rowena Ashworth",
        role: "Partner",
        email: "r.ashworth@lumen.example",
        isPrimary: true,
      },
      {
        name: "Jae-min Seo",
        role: "Principal",
        email: "j.seo@lumen.example",
      },
    ],
    tags: ["capital", "lead-investor"],
  },
  {
    key: "torrens",
    name: "Torrens Angel Collective",
    type: "INVESTOR",
    status: "ACTIVE",
    cadenceDays: 90,
    lastContactDaysAgo: 103, // OVERDUE by 13
    owner: "priya",
    org: "torrens",
    valueToUs: "Local angel syndicate; fast small cheques",
    valueToThem: "Curated local dealflow with diligence already done",
    contacts: [
      {
        name: "Bill Trethowan",
        role: "Convenor",
        email: "bill@torrens.example",
        isPrimary: true,
      },
    ],
    tags: ["capital", "local"],
  },
  {
    key: "kestrel-family",
    name: "Kestrel Family Office",
    type: "INVESTOR",
    status: "PROSPECTIVE",
    cadenceDays: 30,
    lastContactDaysAgo: null, // never contacted
    owner: "priya",
    org: null,
    valueToUs: "Patient capital; interested in regional manufacturing",
    valueToThem: "Access to venture-stage exposure without building a team",
    notes:
      "Introduced by Marcus. Nothing sent yet — needs a one-pager before the first call.",
    tags: ["capital", "warm-intro"],
  },

  {
    key: "adelaide-super",
    name: "Adelaide Superannuation Trust",
    type: "INVESTOR",
    status: "PROSPECTIVE",
    cadenceDays: 60,
    lastContactDaysAgo: 34,
    owner: "avery",
    org: null,
    valueToUs: "Institutional cheque size if the mandate ever fits",
    valueToThem: "Regional exposure that satisfies their local-investment target",
    notes: "Long horizon. Worth keeping warm even though nothing will happen this year.",
    tags: ["capital", "long-game"],
  },

  // ── Delivery partners ───────────────────────────────────────────
  {
    key: "northgate",
    name: "Northgate Digital",
    type: "DELIVERY_PARTNER",
    status: "ACTIVE",
    cadenceDays: 14,
    lastContactDaysAgo: 4,
    owner: "tom",
    org: "northgate",
    valueToUs: "Overflow engineering capacity at short notice",
    valueToThem: "Steady pipeline of scoped work between their own client projects",
    contacts: [
      {
        name: "Ceri Mahoney",
        role: "Engagement Lead",
        email: "ceri@northgate.example",
        isPrimary: true,
      },
      {
        name: "Anil Prakash",
        role: "Tech Lead",
        email: "anil@northgate.example",
      },
    ],
    tags: ["engineering", "capacity"],
  },
  {
    key: "harbourline",
    name: "Harbourline Studios",
    type: "DELIVERY_PARTNER",
    status: "ACTIVE",
    cadenceDays: 30,
    lastContactDaysAgo: 38, // OVERDUE by 8
    owner: "shan",
    org: "harbourline",
    valueToUs: "Brand and motion design",
    valueToThem: "Founding-stage work they can show; introductions to portfolio",
    contacts: [
      {
        name: "Nadia Farrugia",
        role: "Creative Director",
        email: "nadia@harbourline.example",
        isPrimary: true,
      },
    ],
    tags: ["design", "brand"],
  },
  {
    key: "dmitri-contract",
    name: "Fable Interactive",
    type: "DELIVERY_PARTNER",
    status: "PROSPECTIVE",
    cadenceDays: 30,
    lastContactDaysAgo: 8,
    owner: "dmitri",
    org: null,
    valueToUs: "Possible partner for interactive prototypes",
    valueToThem: "Route into venture work",
    tags: ["engineering"],
  },

  {
    key: "two-rivers",
    name: "Two Rivers Data",
    type: "DELIVERY_PARTNER",
    status: "DORMANT",
    cadenceDays: 60,
    lastContactDaysAgo: 138,
    owner: "dmitri",
    org: null,
    valueToUs: "Data engineering for the one project that needed it",
    valueToThem: "Occasional overflow work",
    notes:
      "No current work in common. Resting rather than lapsed — worth reviving if a data-heavy venture starts.",
    tags: ["engineering"],
  },

  // ── Institutional ───────────────────────────────────────────────
  {
    key: "adelaide-uni",
    name: "University of Adelaide — Industry Engagement",
    type: "INSTITUTIONAL",
    status: "ACTIVE",
    cadenceDays: 90,
    lastContactDaysAgo: 74, // DUE_SOON (threshold 18)
    owner: "avery",
    org: "adelaide-uni",
    valueToUs: "Student placements, research access, credibility",
    valueToThem: "Industry projects for capstone students; employment outcomes",
    notes:
      "Placement cohort runs each semester. Industry agreement is on file.",
    contacts: [
      {
        name: "Dr Miriam Halloran",
        role: "Industry Engagement Manager",
        email: "m.halloran@adelaide.example",
        isPrimary: true,
      },
      {
        name: "Peter Ngo",
        role: "Placement Coordinator",
        email: "p.ngo@adelaide.example",
      },
    ],
    tags: ["talent", "research"],
  },
  {
    key: "saic",
    name: "SA Innovation Commission",
    type: "INSTITUTIONAL",
    status: "ACTIVE",
    cadenceDays: 90,
    lastContactDaysAgo: 21,
    owner: "elena",
    org: "saic",
    valueToUs: "Grant programs, policy signal, introductions to state agencies",
    valueToThem: "Evidence that state programs produce ventures",
    contacts: [
      {
        name: "Grace Lomu",
        role: "Program Director",
        email: "g.lomu@saic.example",
        isPrimary: true,
      },
    ],
    tags: ["grants", "government"],
  },
  {
    key: "accel-sa",
    name: "Southern Accelerator Network",
    type: "INSTITUTIONAL",
    status: "PROSPECTIVE",
    cadenceDays: 60,
    lastContactDaysAgo: 88, // OVERDUE by 28
    owner: "priya",
    org: null,
    valueToUs: "Cohort pipeline and mentor network",
    valueToThem: "Studio as a landing place for graduating teams",
    tags: ["pipeline"],
  },

  // ── Suppliers ───────────────────────────────────────────────────
  {
    key: "meridian",
    name: "Meridian Legal",
    type: "SUPPLIER",
    status: "ACTIVE",
    cadenceDays: 182,
    lastContactDaysAgo: 60,
    owner: "elena",
    org: "meridian",
    valueToUs: "Company formation, shareholder agreements, IP assignment",
    valueToThem: "Repeat formation work; referrals to portfolio companies",
    contacts: [
      {
        name: "Simone Delacroix",
        role: "Principal",
        email: "s.delacroix@meridian.example",
        isPrimary: true,
      },
    ],
    tags: ["legal"],
  },
  {
    key: "cobalt",
    name: "Cobalt Cloud Services",
    type: "SUPPLIER",
    status: "ACTIVE",
    cadenceDays: 365,
    lastContactDaysAgo: 340, // DUE_SOON (capped 30-day window)
    owner: "dmitri",
    org: "cobalt",
    valueToUs: "Hosting and infrastructure credits",
    valueToThem: "Reference customer in the venture-studio segment",
    notes: "Annual contract renews in November. Credits worth reviewing before then.",
    tags: ["infrastructure", "renewal"],
  },
  {
    key: "quill-accounting",
    name: "Quill Accounting",
    type: "SUPPLIER",
    status: "ACTIVE",
    cadenceDays: null, // deliberately not on a cadence
    lastContactDaysAgo: 15,
    owner: "elena",
    org: null,
    valueToUs: "Bookkeeping and BAS",
    valueToThem: "Retainer",
    notes: "Purely transactional. No cadence set on purpose — they contact us when it matters.",
    tags: ["finance"],
  },

  // ── Customers ───────────────────────────────────────────────────
  {
    key: "brightpath",
    name: "Brightpath Health",
    type: "CUSTOMER",
    status: "ACTIVE",
    cadenceDays: 14,
    lastContactDaysAgo: 19, // OVERDUE by 5
    owner: "shan",
    org: "brightpath",
    valueToUs: "First paying customer for the scheduling product",
    valueToThem: "A scheduling tool built around their clinic workflow",
    notes:
      "Sensitive to being kept informed. Missing a fortnightly check-in has caused friction before.",
    contacts: [
      {
        name: "Dr Alan Whitcombe",
        role: "Clinical Director",
        email: "a.whitcombe@brightpath.example",
        isPrimary: true,
      },
      {
        name: "Fiona Iyer",
        role: "Practice Manager",
        email: "f.iyer@brightpath.example",
      },
    ],
    tags: ["health", "paying"],
  },
  {
    key: "yarra-freight",
    name: "Yarra Freight Co-op",
    type: "CUSTOMER",
    status: "PROSPECTIVE",
    cadenceDays: 14,
    lastContactDaysAgo: 11, // DUE_SOON
    owner: "tom",
    org: null,
    valueToUs: "Pilot customer for the logistics prototype",
    valueToThem: "A trial of route planning at no cost during the pilot",
    tags: ["logistics", "pilot"],
  },
  {
    key: "orchard-lane",
    name: "Orchard Lane Grocers",
    type: "CUSTOMER",
    status: "ARCHIVED",
    cadenceDays: 30,
    lastContactDaysAgo: 400,
    owner: "tom",
    org: null,
    valueToUs: "Was a pilot customer for the inventory prototype",
    valueToThem: "Free pilot",
    notes:
      "Pilot ended when the product direction changed. Archived rather than deleted — the interaction history explains why the inventory idea was dropped.",
    tags: ["retail"],
  },
  {
    key: "kirra-labs",
    name: "Kirra Labs",
    type: "CUSTOMER",
    status: "DORMANT",
    cadenceDays: 30,
    lastContactDaysAgo: 150,
    owner: "priya",
    org: null,
    valueToUs: "Paid for a discovery sprint; may return with budget next year",
    valueToThem: "A validated scope they can take to their board",
    notes: "Told us to come back in the new financial year. Resting deliberately.",
    tags: ["research"],
  },
];

// ═══════════════════════════════════════════════════════════════════
//  Interaction phrasing
// ═══════════════════════════════════════════════════════════════════

const SUMMARIES: Record<string, string[]> = {
  ADVISOR: [
    "Monthly catch-up. Walked through the current portfolio and where we are stuck.",
    "Asked for a read on the pricing model before we commit to it.",
    "Reviewed the pitch narrative line by line; suggested cutting the second slide.",
    "Offered two introductions, both of which we should follow up.",
  ],
  INVESTOR: [
    "Quarterly update sent and acknowledged.",
    "Call to talk through the follow-on timing.",
    "Discussed reserve strategy for the next two ventures.",
    "Shared the revised model; questions came back on burn.",
  ],
  DELIVERY_PARTNER: [
    "Sprint planning for the shared workstream.",
    "Reviewed the statement of work for the next engagement.",
    "Handover of the design system components.",
    "Retro on the last delivery — mostly positive, one process fix agreed.",
  ],
  INSTITUTIONAL: [
    "Discussed the next placement cohort and what scope would suit it.",
    "Attended their industry showcase; useful conversations afterwards.",
    "Reviewed the grant guidelines and whether we qualify.",
    "Signed and returned the placement schedule.",
  ],
  SUPPLIER: [
    "Renewal conversation; pricing held at last year's rate.",
    "Raised a support issue, resolved same day.",
    "Reviewed the engagement letter for the new entity.",
    "Annual account review.",
  ],
  CUSTOMER: [
    "Fortnightly check-in. Walked through the current build.",
    "Demonstrated the new scheduling view; feedback was positive.",
    "Discussed a defect they raised and agreed a fix date.",
    "Reviewed the pilot metrics together.",
  ],
};

const CHANNELS = ["MEETING", "CALL", "EMAIL", "EVENT", "MESSAGE"] as const;

// ═══════════════════════════════════════════════════════════════════
//  Projects
// ═══════════════════════════════════════════════════════════════════

type ProjectSeed = {
  key: string;
  name: string;
  description: string;
  status: string;
  startDaysAgo: number | null;
  dueDaysAhead: number | null;
  lead: TeamKey;
  relationship: string | null;
  tags?: string[];
  tasks: {
    title: string;
    status: string;
    priority: string;
    dueDaysAhead?: number | null;
    assignee?: TeamKey;
  }[];
};

const PROJECTS: ProjectSeed[] = [
  {
    key: "brightpath-scheduling",
    name: "Brightpath Scheduling — v1",
    description:
      "Clinic scheduling tool for Brightpath Health. First paid engagement; the reference case for the health vertical.",
    status: "ACTIVE",
    startDaysAgo: 62,
    dueDaysAhead: -6, // overdue → at risk
    lead: "shan",
    relationship: "brightpath",
    tags: ["health", "paying"],
    tasks: [
      { title: "Clinic workflow interviews", status: "DONE", priority: "HIGH", assignee: "shan" },
      { title: "Appointment data model", status: "DONE", priority: "HIGH", assignee: "dmitri" },
      { title: "Calendar view", status: "DONE", priority: "HIGH", assignee: "dmitri" },
      { title: "Recurring appointments", status: "IN_PROGRESS", priority: "HIGH", dueDaysAhead: 3, assignee: "dmitri" },
      { title: "Waiting-list handling", status: "BLOCKED", priority: "URGENT", dueDaysAhead: 1, assignee: "tom" },
      { title: "Clinician availability import", status: "TODO", priority: "MEDIUM", dueDaysAhead: 12, assignee: "tom" },
      { title: "Accessibility pass", status: "TODO", priority: "MEDIUM", dueDaysAhead: 18, assignee: "shan" },
      { title: "Pilot handover pack", status: "TODO", priority: "LOW", dueDaysAhead: 25, assignee: "elena" },
    ],
  },
  {
    key: "route-pilot",
    name: "Yarra Freight route pilot",
    description:
      "Route-planning prototype for a freight co-operative. Unpaid pilot to test whether the logistics thesis holds.",
    status: "ACTIVE",
    startDaysAgo: 30,
    dueDaysAhead: 21,
    lead: "tom",
    relationship: "yarra-freight",
    tags: ["logistics", "pilot"],
    tasks: [
      { title: "Depot and vehicle data model", status: "DONE", priority: "HIGH", assignee: "dmitri" },
      { title: "Route optimisation spike", status: "IN_PROGRESS", priority: "HIGH", dueDaysAhead: 5, assignee: "dmitri" },
      { title: "Driver mobile view", status: "TODO", priority: "MEDIUM", dueDaysAhead: 14, assignee: "shan" },
      { title: "Pilot success criteria with Yarra", status: "TODO", priority: "HIGH", dueDaysAhead: 7, assignee: "tom" },
      { title: "Baseline measurement of current routes", status: "IN_PROGRESS", priority: "MEDIUM", dueDaysAhead: 9, assignee: "tom" },
    ],
  },
  {
    key: "studio-brand",
    name: "Studio brand refresh",
    description:
      "Refreshed identity and website ahead of the next capital raise. Delivered with Harbourline.",
    status: "ACTIVE",
    startDaysAgo: 45,
    dueDaysAhead: 10,
    lead: "shan",
    relationship: "harbourline",
    tags: ["brand", "design"],
    tasks: [
      { title: "Brand workshop", status: "DONE", priority: "HIGH", assignee: "shan" },
      { title: "Logo and mark options", status: "DONE", priority: "MEDIUM", assignee: "shan" },
      { title: "Typography and colour system", status: "IN_PROGRESS", priority: "MEDIUM", dueDaysAhead: 4, assignee: "shan" },
      { title: "Website copy", status: "TODO", priority: "MEDIUM", dueDaysAhead: 8, assignee: "avery" },
      { title: "Site build", status: "TODO", priority: "MEDIUM", dueDaysAhead: 10, assignee: "dmitri" },
    ],
  },
  {
    key: "capital-raise",
    name: "Studio vehicle — capital raise",
    description:
      "Raising the second studio vehicle. Lumen leading, with room for the Torrens syndicate.",
    status: "ACTIVE",
    startDaysAgo: 90,
    dueDaysAhead: 60,
    lead: "avery",
    relationship: "lumen",
    tags: ["capital"],
    tasks: [
      { title: "Financial model v3", status: "DONE", priority: "HIGH", assignee: "priya" },
      { title: "Data room", status: "IN_PROGRESS", priority: "HIGH", dueDaysAhead: 11, assignee: "priya" },
      { title: "Investor narrative deck", status: "IN_PROGRESS", priority: "HIGH", dueDaysAhead: 6, assignee: "avery" },
      { title: "Term sheet review with Meridian", status: "TODO", priority: "HIGH", dueDaysAhead: 20, assignee: "elena" },
      { title: "Syndicate briefing session", status: "TODO", priority: "MEDIUM", dueDaysAhead: 35, assignee: "priya" },
      { title: "Reference calls with portfolio founders", status: "TODO", priority: "LOW", dueDaysAhead: 40, assignee: "avery" },
    ],
  },
  {
    key: "placement-program",
    name: "University placement program — Semester 2",
    description:
      "Hosting a capstone placement cohort with the University of Adelaide. Scope, supervise and assess.",
    status: "ACTIVE",
    startDaysAgo: 14,
    dueDaysAhead: 100,
    lead: "elena",
    relationship: "adelaide-uni",
    tags: ["talent"],
    tasks: [
      { title: "Agree project scope with the university", status: "DONE", priority: "HIGH", assignee: "elena" },
      { title: "Return signed Schedule 2", status: "DONE", priority: "HIGH", assignee: "elena" },
      { title: "Onboarding pack for students", status: "IN_PROGRESS", priority: "MEDIUM", dueDaysAhead: 5, assignee: "elena" },
      { title: "Weekly supervision slot", status: "TODO", priority: "MEDIUM", dueDaysAhead: 7, assignee: "tom" },
      { title: "Mid-semester progress review", status: "TODO", priority: "MEDIUM", dueDaysAhead: 50, assignee: "elena" },
    ],
  },
  {
    key: "grant-application",
    name: "SAIC innovation grant application",
    description: "Application to the state innovation fund for the health vertical.",
    status: "PLANNING",
    startDaysAgo: 5,
    dueDaysAhead: 32,
    lead: "priya",
    relationship: "saic",
    tags: ["grants"],
    tasks: [
      { title: "Confirm eligibility", status: "DONE", priority: "HIGH", assignee: "priya" },
      { title: "Draft project description", status: "TODO", priority: "HIGH", dueDaysAhead: 14, assignee: "priya" },
      { title: "Budget and co-contribution", status: "TODO", priority: "HIGH", dueDaysAhead: 18, assignee: "elena" },
      { title: "Letters of support", status: "TODO", priority: "MEDIUM", dueDaysAhead: 24, assignee: "avery" },
    ],
  },
  {
    key: "internal-ops",
    name: "Operations dashboard — internal",
    description:
      "The studio's own relationship and project dashboard. Delivered by the university placement cohort.",
    status: "ACTIVE",
    startDaysAgo: 12,
    dueDaysAhead: 96,
    lead: "tom",
    relationship: "adelaide-uni",
    tags: ["internal"],
    tasks: [
      { title: "Requirements and discovery interviews", status: "DONE", priority: "HIGH", assignee: "tom" },
      { title: "BRM model research and definition", status: "DONE", priority: "HIGH", assignee: "shan" },
      { title: "Shared data model design", status: "DONE", priority: "HIGH", assignee: "dmitri" },
      { title: "Dashboard shell and navigation", status: "IN_PROGRESS", priority: "HIGH", dueDaysAhead: 10, assignee: "dmitri" },
      { title: "BRM module build", status: "IN_PROGRESS", priority: "HIGH", dueDaysAhead: 30, assignee: "shan" },
      { title: "PM module build", status: "TODO", priority: "HIGH", dueDaysAhead: 45, assignee: "tom" },
      { title: "Integration and test plan", status: "TODO", priority: "MEDIUM", dueDaysAhead: 70, assignee: "dmitri" },
      { title: "Final presentation", status: "TODO", priority: "MEDIUM", dueDaysAhead: 95, assignee: "tom" },
    ],
  },
  {
    key: "inventory-prototype",
    name: "Inventory prototype (Orchard Lane)",
    description:
      "Stock-tracking prototype trialled with an independent grocer. Stopped when the thesis did not hold.",
    status: "CANCELLED",
    startDaysAgo: 430,
    dueDaysAhead: -370,
    lead: "tom",
    relationship: "orchard-lane",
    tags: ["retail"],
    tasks: [
      { title: "Stock-take workflow research", status: "DONE", priority: "MEDIUM", assignee: "tom" },
      { title: "Barcode scanning spike", status: "DONE", priority: "MEDIUM", assignee: "dmitri" },
      { title: "Pilot with Orchard Lane", status: "DONE", priority: "HIGH", assignee: "tom" },
      { title: "Decision paper: continue or stop", status: "DONE", priority: "HIGH", assignee: "avery" },
    ],
  },
  {
    key: "kirra-discovery",
    name: "Kirra Labs discovery sprint",
    description: "Two-week paid discovery sprint. Delivered; awaiting their budget cycle.",
    status: "DONE",
    startDaysAgo: 175,
    dueDaysAhead: -158,
    lead: "priya",
    relationship: "kirra-labs",
    tags: ["research"],
    tasks: [
      { title: "Stakeholder interviews", status: "DONE", priority: "HIGH", assignee: "priya" },
      { title: "Opportunity map", status: "DONE", priority: "HIGH", assignee: "shan" },
      { title: "Scoped roadmap and estimate", status: "DONE", priority: "HIGH", assignee: "tom" },
      { title: "Final readout", status: "DONE", priority: "MEDIUM", assignee: "priya" },
    ],
  },
  {
    key: "design-system",
    name: "Shared design system",
    description:
      "Component library reused across ventures. Paused while the brand refresh settles.",
    status: "ON_HOLD",
    startDaysAgo: 120,
    dueDaysAhead: -20,
    lead: "shan",
    relationship: "harbourline",
    tags: ["design", "internal"],
    tasks: [
      { title: "Audit existing components", status: "DONE", priority: "MEDIUM", assignee: "shan" },
      { title: "Token structure", status: "DONE", priority: "MEDIUM", assignee: "dmitri" },
      { title: "Component documentation", status: "BLOCKED", priority: "LOW", assignee: "shan" },
      { title: "Adopt in Brightpath build", status: "TODO", priority: "LOW", assignee: "dmitri" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
//  Seeding
// ═══════════════════════════════════════════════════════════════════

async function clear() {
  // Order matters: children before parents, since SQLite enforces the keys.
  await prisma.task.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.project.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.organisation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.teamMember.deleteMany();
}

async function main() {
  console.log("Seeding The Viemo Studio Operations Dashboard…");
  await clear();

  // ── Team members ──────────────────────────────────────────────
  const memberIds = new Map<TeamKey, string>();
  for (const member of TEAM) {
    const created = await prisma.teamMember.create({
      data: {
        name: member.name,
        title: member.title,
        email: `${member.key}@viemostudio.example`,
      },
    });
    memberIds.set(member.key, created.id);
  }
  console.log(`  ${TEAM.length} team members`);

  // ── Accounts ──────────────────────────────────────────────────
  for (const account of ACCOUNTS) {
    await prisma.user.create({
      data: {
        email: account.email,
        name: TEAM.find((m) => m.key === account.member)!.name,
        passwordHash: await hashPassword(account.password),
        role: account.role,
        teamMemberId: memberIds.get(account.member)!,
      },
    });
  }
  console.log(`  ${ACCOUNTS.length} user accounts`);

  // ── Organisations ─────────────────────────────────────────────
  const orgIds = new Map<OrgKey, string>();
  for (const org of ORGANISATIONS) {
    const created = await prisma.organisation.create({
      data: { name: org.name, website: org.website },
    });
    orgIds.set(org.key, created.id);
  }
  console.log(`  ${ORGANISATIONS.length} organisations`);

  // ── Tags ──────────────────────────────────────────────────────
  const tagLabels = new Set<string>();
  for (const r of RELATIONSHIPS) r.tags?.forEach((t) => tagLabels.add(t));
  for (const p of PROJECTS) p.tags?.forEach((t) => tagLabels.add(t));

  const tones = ["slate", "blue", "violet", "emerald", "amber", "cyan", "fuchsia"];
  const tagIds = new Map<string, string>();
  let toneIndex = 0;
  for (const label of [...tagLabels].sort()) {
    const created = await prisma.tag.create({
      data: { label, colour: tones[toneIndex++ % tones.length] },
    });
    tagIds.set(label, created.id);
  }
  console.log(`  ${tagIds.size} tags`);

  // ── Relationships, contacts, interactions ─────────────────────
  const relationshipIds = new Map<string, string>();
  let interactionCount = 0;
  let contactCount = 0;

  for (const seed of RELATIONSHIPS) {
    const lastContactAt =
      seed.lastContactDaysAgo === null ? null : daysAgo(seed.lastContactDaysAgo);

    const relationship = await prisma.relationship.create({
      data: {
        name: seed.name,
        type: seed.type,
        status: seed.status,
        cadenceDays: seed.cadenceDays,
        lastContactAt,
        valueToUs: seed.valueToUs,
        valueToThem: seed.valueToThem,
        notes: seed.notes ?? null,
        ownerId: memberIds.get(seed.owner)!,
        organisationId: seed.org ? orgIds.get(seed.org)! : null,
        // A relationship never contacted has its cadence clock running from the
        // day it was added, so that date has to be plausible rather than
        // arbitrary — a warm introduction added last month, not one sitting
        // untouched for two years. For the rest, creation must simply precede
        // the last contact.
        createdAt:
          seed.lastContactDaysAgo === null
            ? daysAgo(randomInt(18, 44))
            : daysAgo(seed.lastContactDaysAgo + randomInt(90, 400)),
        tags: seed.tags
          ? { connect: seed.tags.map((t) => ({ id: tagIds.get(t)! })) }
          : undefined,
      },
    });
    relationshipIds.set(seed.key, relationship.id);

    for (const contact of seed.contacts ?? []) {
      await prisma.contact.create({
        data: {
          relationshipId: relationship.id,
          name: contact.name,
          role: contact.role,
          email: contact.email,
          isPrimary: contact.isPrimary ?? false,
        },
      });
      contactCount++;
    }

    // Build a history working backwards from the last contact, spaced at
    // roughly the agreed cadence so the record reads like a real one.
    if (seed.lastContactDaysAgo !== null) {
      const spacing = seed.cadenceDays ?? 45;
      const historyLength = randomInt(3, 7);
      const summaries = SUMMARIES[seed.type] ?? SUMMARIES.ADVISOR;
      // Offset the phrasing per relationship, so two records of the same type
      // do not both open with the same sentence.
      const summaryOffset = randomInt(0, summaries.length - 1);

      for (let i = 0; i < historyLength; i++) {
        const jitter = randomInt(-4, 6);
        const occurredDaysAgo = seed.lastContactDaysAgo + i * spacing + (i === 0 ? 0 : jitter);
        if (occurredDaysAgo > 720) break;

        await prisma.interaction.create({
          data: {
            relationshipId: relationship.id,
            occurredAt: daysAgo(occurredDaysAgo),
            channel: i === 0 ? pick(["MEETING", "CALL"]) : pick(CHANNELS),
            summary: summaries[(i + summaryOffset) % summaries.length],
            // The most recent interaction must be substantive, because it is
            // the one lastContactAt was derived from.
            isSubstantive: i === 0 ? true : random() > 0.25,
            loggedById: memberIds.get(seed.owner)!,
          },
        });
        interactionCount++;
      }
    }
  }
  console.log(
    `  ${RELATIONSHIPS.length} relationships, ${contactCount} contacts, ${interactionCount} interactions`,
  );

  // ── Projects and tasks ────────────────────────────────────────
  let taskCount = 0;
  for (const seed of PROJECTS) {
    const project = await prisma.project.create({
      data: {
        name: seed.name,
        description: seed.description,
        status: seed.status,
        startDate: seed.startDaysAgo === null ? null : daysAgo(seed.startDaysAgo),
        dueDate: seed.dueDaysAhead === null ? null : daysAhead(seed.dueDaysAhead),
        leadId: memberIds.get(seed.lead)!,
        relationshipId: seed.relationship
          ? (relationshipIds.get(seed.relationship) ?? null)
          : null,
        createdAt: seed.startDaysAgo === null ? NOW : daysAgo(seed.startDaysAgo),
        tags: seed.tags
          ? { connect: seed.tags.map((t) => ({ id: tagIds.get(t)! })) }
          : undefined,
      },
    });

    let order = 0;
    for (const task of seed.tasks) {
      await prisma.task.create({
        data: {
          projectId: project.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate:
            task.dueDaysAhead === undefined || task.dueDaysAhead === null
              ? null
              : daysAhead(task.dueDaysAhead),
          assigneeId: task.assignee ? memberIds.get(task.assignee)! : null,
          order: order++,
          completedAt: task.status === "DONE" ? daysAgo(randomInt(1, 30)) : null,
        },
      });
      taskCount++;
    }
  }
  console.log(`  ${PROJECTS.length} projects, ${taskCount} tasks`);

  // ── Link a few interactions to projects, exercising the seam ──
  const seams: [string, string][] = [
    ["brightpath", "Brightpath Scheduling — v1"],
    ["yarra-freight", "Yarra Freight route pilot"],
    ["harbourline", "Studio brand refresh"],
    ["lumen", "Studio vehicle — capital raise"],
    ["adelaide-uni", "University placement program — Semester 2"],
  ];

  let seamCount = 0;
  for (const [relationshipKey, projectName] of seams) {
    const relationshipId = relationshipIds.get(relationshipKey);
    const project = await prisma.project.findFirst({ where: { name: projectName } });
    if (!relationshipId || !project) continue;

    const latest = await prisma.interaction.findFirst({
      where: { relationshipId },
      orderBy: { occurredAt: "desc" },
    });
    if (!latest) continue;

    await prisma.interaction.update({
      where: { id: latest.id },
      data: { projectId: project.id },
    });
    seamCount++;
  }
  console.log(`  ${seamCount} interactions linked to projects`);

  console.log("\nSeed complete. Sign in with:");
  for (const account of ACCOUNTS) {
    console.log(`  ${account.role.padEnd(7)} ${account.email}  /  ${account.password}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
