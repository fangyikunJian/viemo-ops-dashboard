/**
 * The agent seam.
 *
 * The client's stated ambition is to "digitally twin" himself — capture the
 * workflows he runs by hand and have the system run them. Claude is already in
 * his stack. In the same conversation he raised the two things that make that
 * dangerous rather than useful: **what it costs**, and **what stops it doing
 * something stupid**.
 *
 * This file is the answer to both, and it deliberately contains no model call.
 *
 * ── Why a port and not an implementation ──────────────────────────────────
 *
 * The placement brief does not mention AI once and requires "no connection to
 * any live or confidential systems", which rules out the integrations a real
 * workflow agent would need. Shipping a half-built agent would also be exactly
 * the risk he named: an agent with no cost ceiling and untested instructions is
 * a liability to demonstrate.
 *
 * So the boundary is built and the implementation is not. A future team writes
 * an adapter against `AgentAdapter`, registers it, and nothing in lib/brm,
 * lib/pm or the schema changes. Same treatment the Jira question got — see
 * docs/adr/0007.
 *
 * ── The three rules the contract enforces ─────────────────────────────────
 *
 * **1. An agent proposes; it never acts.** Every method returns
 * `AgentProposal[]`. There is no path from this interface to a database write.
 * A proposal becomes a change only when a person approves it, through the same
 * server actions and the same permission checks as anything else — so an agent
 * can never do what the person driving it could not do themselves.
 *
 * **2. Every run declares what it cost.** `AgentRun` carries token counts and
 * an estimate in cents. An adapter that cannot report cost cannot satisfy the
 * interface. That makes "what is this costing us" answerable on day one rather
 * than after the first invoice.
 *
 * **3. A run is bounded before it starts.** `AgentBudget` caps spend and wall
 * time per run. An adapter is required to stop at the ceiling and say it
 * stopped, rather than running to completion and apologising.
 */

import type {
  OutboundProject,
  OutboundRelationship,
  OutboundSnapshot,
} from "./types";

// ═══════════════════════════════════════════════════════════════════
//  What an agent is allowed to suggest
// ═══════════════════════════════════════════════════════════════════

/**
 * The complete set of things an agent may propose.
 *
 * Deliberately small, and deliberately enumerated rather than free-form. An
 * agent that can propose "any action" is an agent nobody can review, and the
 * review step is the whole safety story. Adding a kind here is a decision, not
 * a configuration change.
 */
export const PROPOSAL_KINDS = [
  /** "You have not spoken to Dr Chen in two months; here is a draft note." */
  "DRAFT_INTERACTION",
  /** "This relationship looks dormant in practice; consider changing status." */
  "SUGGEST_STATUS_CHANGE",
  /** "Fortnightly is not being met; a monthly cadence may be more honest." */
  "SUGGEST_CADENCE_CHANGE",
  /** "These three tasks are overdue and unassigned." */
  "FLAG_STALE_WORK",
  /** "Here is this week's position, in prose." */
  "SUMMARISE",
] as const;

export type ProposalKind = (typeof PROPOSAL_KINDS)[number];

export const PROPOSAL_KIND_LABELS: Record<ProposalKind, string> = {
  DRAFT_INTERACTION: "Draft a note",
  SUGGEST_STATUS_CHANGE: "Suggest a status change",
  SUGGEST_CADENCE_CHANGE: "Suggest a cadence change",
  FLAG_STALE_WORK: "Flag stale work",
  SUMMARISE: "Summarise",
};

export type AgentProposal = {
  kind: ProposalKind;
  /** What it is about — "relationship", "project", "task". */
  resource: string;
  resourceId: string | null;
  /** One line a person can approve or reject without opening anything else. */
  headline: string;
  /** The full suggestion: the draft text, or the reasoning. */
  detail: string;
  /**
   * Why the agent thinks this. Required, because a suggestion whose reasoning
   * cannot be checked is a suggestion that cannot be trusted.
   */
  rationale: string;
  /**
   * The agent's own confidence, 0 to 1. Advisory only — nothing in the system
   * treats a high number as permission to skip the human.
   */
  confidence: number;
};

// ═══════════════════════════════════════════════════════════════════
//  Cost and limits
// ═══════════════════════════════════════════════════════════════════

export type AgentBudget = {
  /** Hard ceiling for one run, in cents. The adapter must stop at it. */
  maxCents: number;
  /** Hard ceiling for one run, in milliseconds. */
  maxMillis: number;
  /** Cap on proposals returned, so review stays a five-minute job. */
  maxProposals: number;
};

/** Conservative defaults. A team can raise them once it has seen real numbers. */
export const DEFAULT_BUDGET: AgentBudget = {
  maxCents: 50,
  maxMillis: 60_000,
  maxProposals: 10,
};

export type AgentCost = {
  inputTokens: number;
  outputTokens: number;
  /** Estimated, not billed. Adapters should round up rather than down. */
  estimatedCents: number;
};

export type AgentRun = {
  adapterId: string;
  startedAt: string;
  finishedAt: string;
  cost: AgentCost;
  proposals: AgentProposal[];
  /**
   * Set when the run stopped early. An adapter that hits a ceiling must say so
   * — silently returning fewer proposals looks identical to "there was nothing
   * to suggest", and the two call for opposite responses.
   */
  stoppedBecause?: "BUDGET" | "TIME" | "PROPOSAL_LIMIT" | "ERROR";
  /** Present when `stoppedBecause` is ERROR. */
  error?: string;
};

// ═══════════════════════════════════════════════════════════════════
//  The port
// ═══════════════════════════════════════════════════════════════════

/**
 * What an agent is given.
 *
 * A read-only snapshot and nothing else — no credentials, no database handle,
 * no way to reach the network on the application's behalf. Whatever an adapter
 * does with the snapshot, it cannot change anything by doing it.
 */
export type AgentContext = {
  snapshot: OutboundSnapshot;
  /** So the agent reasons about the same "now" the dashboard displayed. */
  now: string;
  budget: AgentBudget;
};

export interface AgentAdapter {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Which kinds this adapter can produce. Callers check before calling. */
  readonly kinds: readonly ProposalKind[];
  /** False for a documented stub. Never lie about this. */
  readonly implemented: boolean;
  /** Named so a reviewer can check what the proposals were produced by. */
  readonly model?: string;

  review(context: AgentContext): Promise<AgentRun>;
}

export function supportsKind(
  adapter: AgentAdapter,
  kind: ProposalKind,
): boolean {
  return adapter.kinds.includes(kind);
}

/** Whether a run stayed inside what it was allowed to spend. */
export function withinBudget(run: AgentRun, budget: AgentBudget): boolean {
  return (
    run.cost.estimatedCents <= budget.maxCents &&
    run.proposals.length <= budget.maxProposals
  );
}

/** Total spend across runs — for "what is this costing us". */
export function totalCents(runs: readonly AgentRun[]): number {
  return runs.reduce((sum, run) => sum + run.cost.estimatedCents, 0);
}

// ═══════════════════════════════════════════════════════════════════
//  The stub
// ═══════════════════════════════════════════════════════════════════

/**
 * What a Claude-backed adapter would have to settle first.
 *
 * Written down and compiled rather than left in a document, so it cannot go
 * stale and so the shape it must implement is checked by the type system.
 *
 * **1. Where the key lives.** The application has no secret store, because it
 * has never needed one. An API key in an environment variable is fine for one
 * deployment and wrong the moment there are several.
 *
 * **2. What a proposal is worth.** The cost ceiling above is a guess. Nobody
 * knows yet whether a weekly review costs five cents or five dollars, and the
 * answer decides whether this is a feature or a line item.
 *
 * **3. Who approves, and how fast.** A proposal nobody reviews is either
 * ignored or, worse, trusted. That is a workflow decision for the client, not
 * a technical one — and it is the difference between a digital twin and an
 * expensive random number generator.
 *
 * Until those three have answers, this returns nothing and says why.
 */
export const claudeStubAdapter: AgentAdapter = {
  id: "claude-review",
  label: "Claude review (not implemented)",
  description:
    "Would read the operating picture and propose drafts and status changes for a person to approve. Needs a secret store, a measured cost per run, and an agreed approval workflow before it can be built.",
  kinds: [
    "DRAFT_INTERACTION",
    "SUGGEST_STATUS_CHANGE",
    "SUGGEST_CADENCE_CHANGE",
    "SUMMARISE",
  ],
  implemented: false,

  async review(context: AgentContext): Promise<AgentRun> {
    const at = new Date().toISOString();
    return {
      adapterId: "claude-review",
      startedAt: at,
      finishedAt: at,
      cost: { inputTokens: 0, outputTokens: 0, estimatedCents: 0 },
      proposals: [],
      stoppedBecause: "ERROR",
      error:
        `Not implemented. Reviewing ${context.snapshot.relationships.length} relationships ` +
        `and ${context.snapshot.projects.length} projects would need a configured API key, ` +
        `a measured cost per run to size the ${context.budget.maxCents}c ceiling against, ` +
        `and an agreed workflow for who approves a proposal and how quickly.`,
    };
  },
};

/**
 * A deterministic agent with no model behind it.
 *
 * Real and useful: it produces the proposals the rules can already justify, so
 * the seam is exercised end to end rather than being an interface nobody has
 * run anything through. It also sets the bar — anything a language model
 * proposes should be more useful than this, and if it is not, the money is
 * being wasted.
 */
export const rulesAgentAdapter: AgentAdapter = {
  id: "rules",
  label: "Rules review",
  description:
    "Proposes from the cadence and health rules alone. No model, no cost, fully deterministic — the baseline any AI adapter has to beat.",
  kinds: ["SUGGEST_STATUS_CHANGE", "FLAG_STALE_WORK"],
  implemented: true,

  async review(context: AgentContext): Promise<AgentRun> {
    const startedAt = new Date().toISOString();
    const now = Date.parse(context.now);

    // Collected in full, then capped — stopping the loop early would leave the
    // adapter unable to tell "there was nothing to suggest" from "there was
    // more than you asked for", and those call for opposite responses.
    const proposals: AgentProposal[] = [];
    for (const relationship of context.snapshot.relationships) {
      proposals.push(...proposeForRelationship(relationship, now));
    }
    for (const project of context.snapshot.projects) {
      const stale = proposeForProject(project);
      if (stale) proposals.push(stale);
    }

    return {
      adapterId: "rules",
      startedAt,
      finishedAt: new Date().toISOString(),
      cost: { inputTokens: 0, outputTokens: 0, estimatedCents: 0 },
      proposals: proposals.slice(0, context.budget.maxProposals),
      stoppedBecause:
        proposals.length > context.budget.maxProposals
          ? "PROPOSAL_LIMIT"
          : undefined,
    };
  },
};

/**
 * Long-overdue active relationships are usually dormant in practice.
 *
 * Takes `now` rather than reading the clock, for the same reason
 * lib/brm/cadence.ts does: a function that reads the clock cannot be tested
 * deterministically, and an agent reasoning about a different "now" than the
 * dashboard displayed will propose things that do not match what the reader
 * is looking at.
 */
function proposeForRelationship(
  relationship: OutboundRelationship,
  now: number,
): AgentProposal[] {
  if (relationship.status !== "ACTIVE" || !relationship.cadenceDays) return [];
  if (!relationship.lastContactAt) return [];

  const daysSince = Math.round(
    (now - Date.parse(relationship.lastContactAt)) / 86_400_000,
  );
  // Three missed windows is a pattern, not a slip.
  if (daysSince < relationship.cadenceDays * 3) return [];

  return [
    {
      kind: "SUGGEST_STATUS_CHANGE",
      resource: "relationship",
      resourceId: relationship.id,
      headline: `${relationship.name} may be dormant rather than active`,
      detail:
        `Last substantive contact was ${daysSince} days ago against an agreed ` +
        `cadence of ${relationship.cadenceDays} days. Either the cadence is ` +
        `wrong or the relationship is resting; recording it as dormant would ` +
        `make the overdue count honest again.`,
      rationale: `${daysSince} days elapsed is more than three times the ${relationship.cadenceDays}-day cadence.`,
      confidence: 0.7,
    },
  ];
}

/** An active project where every task is done but nobody closed it. */
function proposeForProject(project: OutboundProject): AgentProposal | null {
  if (project.status !== "ACTIVE") return null;
  if (project.tasks.length === 0) return null;
  if (!project.tasks.every((task) => task.status === "DONE")) return null;

  return {
    kind: "FLAG_STALE_WORK",
    resource: "project",
    resourceId: project.id,
    headline: `${project.name} has no work left but is still active`,
    detail: `All ${project.tasks.length} tasks are done. If the work is finished, marking the project Done keeps the in-flight count meaningful.`,
    rationale: "Every task is DONE while the project status is ACTIVE.",
    confidence: 0.85,
  };
}

export const AGENT_ADAPTERS: readonly AgentAdapter[] = [
  rulesAgentAdapter,
  claudeStubAdapter,
];

export function findAgentAdapter(id: string): AgentAdapter | undefined {
  return AGENT_ADAPTERS.find((adapter) => adapter.id === id);
}
