/**
 * The controlled vocabularies of the shared data model.
 *
 * SQLite cannot store enums, so these columns are String in the database and
 * this module is the single source of truth for what may go in them. Every
 * write validates against the zod schemas here; every screen reads its labels
 * from here. The BRM taxonomy deliverable is generated from this file, so the
 * definitions below are written to be read by people, not only by the compiler.
 */

import { z } from "zod";

/** Shared shape for a vocabulary term that the UI needs to render. */
export type Term<T extends string> = {
  value: T;
  label: string;
  /** One sentence a new team member could learn the term from. */
  description: string;
  /** Tailwind colour family used for the term's badge. */
  tone: Tone;
};

export type Tone =
  | "slate"
  | "blue"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "fuchsia";

// ═══════════════════════════════════════════════════════════════════
//  Relationship type — the BRM taxonomy
// ═══════════════════════════════════════════════════════════════════

/**
 * A conventional CRM has one implicit relationship type: the customer, at some
 * point along a sales funnel. A venture studio's operating reality is wider —
 * the people who most determine whether it succeeds are frequently not paying
 * it anything. These six types cover that spectrum. They are deliberately about
 * *what the relationship is for*, not about how much revenue it produces.
 */
export const RELATIONSHIP_TYPES = [
  "ADVISOR",
  "INVESTOR",
  "DELIVERY_PARTNER",
  "INSTITUTIONAL",
  "SUPPLIER",
  "CUSTOMER",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];
export const relationshipTypeSchema = z.enum(RELATIONSHIP_TYPES);

export const RELATIONSHIP_TYPE_TERMS: Record<
  RelationshipType,
  Term<RelationshipType>
> = {
  ADVISOR: {
    value: "ADVISOR",
    label: "Advisor",
    description:
      "Provides judgement, expertise or introductions, usually informally and usually unpaid. The value received is counsel; the value returned is typically visibility, equity or reciprocity.",
    tone: "violet",
  },
  INVESTOR: {
    value: "INVESTOR",
    label: "Investor",
    description:
      "Has invested, or is a credible prospect to invest, in the studio or a venture within it. Includes existing investors, who a CRM would consider closed and stop tracking.",
    tone: "emerald",
  },
  DELIVERY_PARTNER: {
    value: "DELIVERY_PARTNER",
    label: "Delivery partner",
    description:
      "Builds or ships alongside the studio — agencies, contractors, technical collaborators. The relationship is peer-to-peer and the work usually flows in both directions.",
    tone: "blue",
  },
  INSTITUTIONAL: {
    value: "INSTITUTIONAL",
    label: "Institutional",
    description:
      "Universities, government bodies, accelerators, industry associations. Slow-moving, high-leverage, and maintained through consistent presence rather than transactions.",
    tone: "cyan",
  },
  SUPPLIER: {
    value: "SUPPLIER",
    label: "Supplier",
    description:
      "Provides goods or services the studio pays for. Tracked so that dependencies and renewal conversations are visible, not to manage a purchasing pipeline.",
    tone: "amber",
  },
  CUSTOMER: {
    value: "CUSTOMER",
    label: "Customer",
    description:
      "Pays the studio for work or product. One relationship type among six, rather than the organising assumption of the whole system.",
    tone: "fuchsia",
  },
};

// ═══════════════════════════════════════════════════════════════════
//  Relationship status — a lifecycle, not a funnel
// ═══════════════════════════════════════════════════════════════════

/**
 * The critical structural difference from a CRM. Pipeline stages are ordered
 * and terminal: a deal advances toward Won or Lost and then leaves the board.
 * These four states are a cycle. A relationship may move from Active to Dormant
 * and back again several times over years, and neither direction is a failure.
 * Nothing in the application treats a later status as better than an earlier one.
 */
export const RELATIONSHIP_STATUSES = [
  "PROSPECTIVE",
  "ACTIVE",
  "DORMANT",
  "ARCHIVED",
] as const;

export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];
export const relationshipStatusSchema = z.enum(RELATIONSHIP_STATUSES);

export const RELATIONSHIP_STATUS_TERMS: Record<
  RelationshipStatus,
  Term<RelationshipStatus>
> = {
  PROSPECTIVE: {
    value: "PROSPECTIVE",
    label: "Prospective",
    description:
      "Identified as worth building, but not yet established. Contact has been limited or one-directional.",
    tone: "slate",
  },
  ACTIVE: {
    value: "ACTIVE",
    label: "Active",
    description:
      "A live, two-way relationship being maintained to an agreed cadence.",
    tone: "emerald",
  },
  DORMANT: {
    value: "DORMANT",
    label: "Dormant",
    description:
      "Real and valuable, but intentionally quiet. Dormant is a legitimate resting state, not a lapsed one — it is how the model distinguishes a relationship you have chosen to rest from one you are neglecting.",
    tone: "amber",
  },
  ARCHIVED: {
    value: "ARCHIVED",
    label: "Archived",
    description:
      "No longer maintained. Retained for history so that past context is not lost if the relationship is later revived.",
    tone: "slate",
  },
};

/** Statuses whose contact cadence is actively tracked on the dashboard. */
export const CADENCE_TRACKED_STATUSES: readonly RelationshipStatus[] = [
  "ACTIVE",
  "PROSPECTIVE",
];

// ═══════════════════════════════════════════════════════════════════
//  Interaction channel
// ═══════════════════════════════════════════════════════════════════

export const INTERACTION_CHANNELS = [
  "MEETING",
  "CALL",
  "EMAIL",
  "EVENT",
  "MESSAGE",
] as const;

export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number];
export const interactionChannelSchema = z.enum(INTERACTION_CHANNELS);

export const INTERACTION_CHANNEL_TERMS: Record<
  InteractionChannel,
  Term<InteractionChannel>
> = {
  MEETING: {
    value: "MEETING",
    label: "Meeting",
    description: "In person or video, scheduled and two-way.",
    tone: "blue",
  },
  CALL: {
    value: "CALL",
    label: "Call",
    description: "A voice conversation, scheduled or not.",
    tone: "cyan",
  },
  EMAIL: {
    value: "EMAIL",
    label: "Email",
    description: "Written correspondence.",
    tone: "slate",
  },
  EVENT: {
    value: "EVENT",
    label: "Event",
    description:
      "Contact made at a conference, demo night or similar gathering.",
    tone: "violet",
  },
  MESSAGE: {
    value: "MESSAGE",
    label: "Message",
    description: "Short-form: SMS, LinkedIn, Slack, WhatsApp.",
    tone: "amber",
  },
};

// ═══════════════════════════════════════════════════════════════════
//  Cadence status — derived, never stored
// ═══════════════════════════════════════════════════════════════════

/**
 * The BRM module's health signal, computed by lib/brm/cadence.ts. A CRM asks
 * "how close is this deal to closing?"; the BRM asks "is this relationship
 * being maintained at the rhythm we agreed?".
 */
export const CADENCE_STATUSES = [
  "NOT_TRACKED",
  "ON_TRACK",
  "DUE_SOON",
  "OVERDUE",
] as const;

export type CadenceStatus = (typeof CADENCE_STATUSES)[number];

export const CADENCE_STATUS_TERMS: Record<CadenceStatus, Term<CadenceStatus>> =
  {
    NOT_TRACKED: {
      value: "NOT_TRACKED",
      label: "Not tracked",
      description:
        "No cadence has been agreed for this relationship, or its status places it outside cadence tracking. Deliberately different from being overdue.",
      tone: "slate",
    },
    ON_TRACK: {
      value: "ON_TRACK",
      label: "On track",
      description: "Contacted within the agreed rhythm.",
      tone: "emerald",
    },
    DUE_SOON: {
      value: "DUE_SOON",
      label: "Due soon",
      description:
        "Inside the final fifth of the cadence window — time to reach out before it lapses.",
      tone: "amber",
    },
    OVERDUE: {
      value: "OVERDUE",
      label: "Overdue",
      description:
        "The agreed rhythm has been missed. This is the single number the dashboard exists to keep at zero.",
      tone: "rose",
    },
  };

/** Cadence presets offered in the UI, in days. */
export const CADENCE_PRESETS = [
  { days: 7, label: "Weekly" },
  { days: 14, label: "Fortnightly" },
  { days: 30, label: "Monthly" },
  { days: 90, label: "Quarterly" },
  { days: 182, label: "Twice a year" },
  { days: 365, label: "Annually" },
] as const;

// ═══════════════════════════════════════════════════════════════════
//  Project status
// ═══════════════════════════════════════════════════════════════════

export const PROJECT_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "DONE",
  "CANCELLED",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const projectStatusSchema = z.enum(PROJECT_STATUSES);

export const PROJECT_STATUS_TERMS: Record<ProjectStatus, Term<ProjectStatus>> =
  {
    PLANNING: {
      value: "PLANNING",
      label: "Planning",
      description: "Scoped but not yet underway.",
      tone: "slate",
    },
    ACTIVE: {
      value: "ACTIVE",
      label: "Active",
      description: "Work in progress.",
      tone: "blue",
    },
    ON_HOLD: {
      value: "ON_HOLD",
      label: "On hold",
      description: "Paused deliberately; not at risk by virtue of being paused.",
      tone: "amber",
    },
    DONE: {
      value: "DONE",
      label: "Done",
      description: "Delivered.",
      tone: "emerald",
    },
    CANCELLED: {
      value: "CANCELLED",
      label: "Cancelled",
      description: "Stopped and not intended to resume.",
      tone: "slate",
    },
  };

/** Statuses for which risk and progress are worth surfacing. */
export const LIVE_PROJECT_STATUSES: readonly ProjectStatus[] = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
];

// ═══════════════════════════════════════════════════════════════════
//  Task status & priority
// ═══════════════════════════════════════════════════════════════════

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export const taskStatusSchema = z.enum(TASK_STATUSES);

export const TASK_STATUS_TERMS: Record<TaskStatus, Term<TaskStatus>> = {
  TODO: {
    value: "TODO",
    label: "To do",
    description: "Not started.",
    tone: "slate",
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "In progress",
    description: "Being worked on now.",
    tone: "blue",
  },
  BLOCKED: {
    value: "BLOCKED",
    label: "Blocked",
    description:
      "Cannot proceed until something external changes. A blocked task puts its project at risk.",
    tone: "rose",
  },
  DONE: {
    value: "DONE",
    label: "Done",
    description: "Complete.",
    tone: "emerald",
  },
};

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

export const TASK_PRIORITY_TERMS: Record<TaskPriority, Term<TaskPriority>> = {
  LOW: {
    value: "LOW",
    label: "Low",
    description: "Can wait.",
    tone: "slate",
  },
  MEDIUM: {
    value: "MEDIUM",
    label: "Medium",
    description: "Normal working priority.",
    tone: "blue",
  },
  HIGH: {
    value: "HIGH",
    label: "High",
    description: "Should be picked up ahead of other work.",
    tone: "amber",
  },
  URGENT: {
    value: "URGENT",
    label: "Urgent",
    description: "Needs attention today.",
    tone: "rose",
  },
};

// ═══════════════════════════════════════════════════════════════════
//  Access roles
// ═══════════════════════════════════════════════════════════════════

export const USER_ROLES = ["ADMIN", "MEMBER", "VIEWER"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export const userRoleSchema = z.enum(USER_ROLES);

export const USER_ROLE_TERMS: Record<UserRole, Term<UserRole>> = {
  ADMIN: {
    value: "ADMIN",
    label: "Admin",
    description:
      "Full access, including user management, archiving and permanent deletion.",
    tone: "violet",
  },
  MEMBER: {
    value: "MEMBER",
    label: "Member",
    description:
      "Creates and edits relationships, interactions, projects and tasks. Cannot manage users or delete records outright.",
    tone: "blue",
  },
  VIEWER: {
    value: "VIEWER",
    label: "Viewer",
    description:
      "Read-only across the dashboard and both modules. Intended for advisors and observers who need visibility without edit rights.",
    tone: "slate",
  },
};
