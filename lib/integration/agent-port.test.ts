import { describe, expect, it } from "vitest";
import {
  AGENT_ADAPTERS,
  DEFAULT_BUDGET,
  PROPOSAL_KINDS,
  PROPOSAL_KIND_LABELS,
  claudeStubAdapter,
  findAgentAdapter,
  rulesAgentAdapter,
  supportsKind,
  totalCents,
  withinBudget,
  type AgentContext,
  type AgentRun,
} from "./agent-port";
import type { OutboundSnapshot } from "./types";

const NOW = new Date("2026-08-20T00:00:00.000Z");

function daysBefore(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function snapshot(
  overrides: Partial<OutboundSnapshot> = {},
): OutboundSnapshot {
  return {
    takenAt: NOW.toISOString(),
    projects: [],
    relationships: [],
    ...overrides,
  };
}

function context(snap: OutboundSnapshot, budget = DEFAULT_BUDGET): AgentContext {
  return { snapshot: snap, now: NOW.toISOString(), budget };
}

function relationship(over: Partial<OutboundSnapshot["relationships"][number]> = {}) {
  return {
    id: "r1",
    name: "Dr Sarah Chen",
    type: "ADVISOR" as const,
    status: "ACTIVE" as const,
    cadenceDays: 30,
    lastContactAt: daysBefore(10),
    ownerName: "Avery Nakamura",
    organisationName: null,
    tags: [],
    interactionCount: 4,
    ...over,
  };
}

function project(over: Partial<OutboundSnapshot["projects"][number]> = {}) {
  return {
    id: "p1",
    name: "Brightpath Scheduling",
    description: null,
    status: "ACTIVE" as const,
    startDate: null,
    dueDate: null,
    leadName: "Shanice Boateng",
    relationshipName: null,
    tags: [],
    tasks: [],
    ...over,
  };
}

describe("the agent contract", () => {
  it("gives every proposal kind a human label", () => {
    for (const kind of PROPOSAL_KINDS) {
      expect(PROPOSAL_KIND_LABELS[kind], `${kind} has no label`).toBeTruthy();
    }
  });

  it("only declares kinds that exist", () => {
    for (const adapter of AGENT_ADAPTERS) {
      for (const kind of adapter.kinds) {
        expect(PROPOSAL_KINDS).toContain(kind);
      }
    }
  });

  it("gives every adapter a unique id", () => {
    const ids = AGENT_ADAPTERS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("finds an adapter by id and returns nothing for an unknown one", () => {
    expect(findAgentAdapter("rules")).toBe(rulesAgentAdapter);
    expect(findAgentAdapter("gpt-9")).toBeUndefined();
  });

  it("reports whether an adapter supports a kind", () => {
    expect(supportsKind(rulesAgentAdapter, "FLAG_STALE_WORK")).toBe(true);
    expect(supportsKind(rulesAgentAdapter, "DRAFT_INTERACTION")).toBe(false);
  });
});

describe("budgets", () => {
  const run = (cents: number, proposals: number): AgentRun => ({
    adapterId: "x",
    startedAt: NOW.toISOString(),
    finishedAt: NOW.toISOString(),
    cost: { inputTokens: 0, outputTokens: 0, estimatedCents: cents },
    proposals: Array.from({ length: proposals }, () => ({
      kind: "SUMMARISE" as const,
      resource: "project",
      resourceId: null,
      headline: "x",
      detail: "x",
      rationale: "x",
      confidence: 0.5,
    })),
  });

  it("accepts a run inside its ceiling", () => {
    expect(withinBudget(run(10, 3), DEFAULT_BUDGET)).toBe(true);
  });

  it("rejects a run that spent more than it was allowed", () => {
    expect(withinBudget(run(DEFAULT_BUDGET.maxCents + 1, 1), DEFAULT_BUDGET)).toBe(
      false,
    );
  });

  it("rejects a run that returned more proposals than a person can review", () => {
    expect(
      withinBudget(run(1, DEFAULT_BUDGET.maxProposals + 1), DEFAULT_BUDGET),
    ).toBe(false);
  });

  it("adds up what several runs cost", () => {
    expect(totalCents([run(12, 1), run(30, 1), run(8, 1)])).toBe(50);
  });

  it("defaults to a ceiling low enough that a mistake is cheap", () => {
    // The point of the default is that discovering a runaway loop costs cents,
    // not a bill. If someone raises this, it should be a decision.
    expect(DEFAULT_BUDGET.maxCents).toBeLessThanOrEqual(100);
    expect(DEFAULT_BUDGET.maxProposals).toBeLessThanOrEqual(20);
  });
});

describe("the rules adapter", () => {
  it("suggests dormant for a relationship three cadences overdue", async () => {
    const run = await rulesAgentAdapter.review(
      context(
        snapshot({
          relationships: [
            relationship({ cadenceDays: 30, lastContactAt: daysBefore(95) }),
          ],
        }),
      ),
    );

    expect(run.proposals).toHaveLength(1);
    expect(run.proposals[0].kind).toBe("SUGGEST_STATUS_CHANGE");
    expect(run.proposals[0].resourceId).toBe("r1");
    expect(run.proposals[0].rationale).toContain("95");
  });

  it("leaves a merely overdue relationship alone", async () => {
    // One missed window is a slip. Proposing a status change for every overdue
    // relationship would bury the ones that are genuinely dormant.
    const run = await rulesAgentAdapter.review(
      context(
        snapshot({
          relationships: [
            relationship({ cadenceDays: 30, lastContactAt: daysBefore(40) }),
          ],
        }),
      ),
    );

    expect(run.proposals).toHaveLength(0);
  });

  it("ignores relationships that are not being tracked", async () => {
    const run = await rulesAgentAdapter.review(
      context(
        snapshot({
          relationships: [
            relationship({ status: "DORMANT", lastContactAt: daysBefore(400) }),
            relationship({ id: "r2", cadenceDays: null }),
            relationship({ id: "r3", lastContactAt: null }),
          ],
        }),
      ),
    );

    expect(run.proposals).toHaveLength(0);
  });

  it("flags an active project whose tasks are all done", async () => {
    const run = await rulesAgentAdapter.review(
      context(
        snapshot({
          projects: [
            project({
              tasks: [
                { id: "t1", title: "a", status: "DONE", priority: "HIGH", dueDate: null, assigneeName: null },
                { id: "t2", title: "b", status: "DONE", priority: "LOW", dueDate: null, assigneeName: null },
              ],
            }),
          ],
        }),
      ),
    );

    expect(run.proposals).toHaveLength(1);
    expect(run.proposals[0].kind).toBe("FLAG_STALE_WORK");
  });

  it("does not flag a project that still has open work", async () => {
    const run = await rulesAgentAdapter.review(
      context(
        snapshot({
          projects: [
            project({
              tasks: [
                { id: "t1", title: "a", status: "DONE", priority: "HIGH", dueDate: null, assigneeName: null },
                { id: "t2", title: "b", status: "TODO", priority: "LOW", dueDate: null, assigneeName: null },
              ],
            }),
          ],
        }),
      ),
    );

    expect(run.proposals).toHaveLength(0);
  });

  it("stops at the proposal ceiling and says that it stopped", async () => {
    // Silently returning fewer proposals looks identical to "nothing to
    // suggest", and the two call for opposite responses.
    const many = Array.from({ length: 8 }, (_, i) =>
      relationship({ id: `r${i}`, cadenceDays: 30, lastContactAt: daysBefore(200) }),
    );

    const run = await rulesAgentAdapter.review(
      context(snapshot({ relationships: many }), {
        ...DEFAULT_BUDGET,
        maxProposals: 3,
      }),
    );

    expect(run.proposals).toHaveLength(3);
    expect(run.stoppedBecause).toBe("PROPOSAL_LIMIT");
  });

  it("costs nothing, because there is no model behind it", async () => {
    const run = await rulesAgentAdapter.review(context(snapshot()));
    expect(run.cost.estimatedCents).toBe(0);
    expect(run.stoppedBecause).toBeUndefined();
  });

  it("gives every proposal a rationale a person can check", async () => {
    const run = await rulesAgentAdapter.review(
      context(
        snapshot({
          relationships: [relationship({ lastContactAt: daysBefore(200) })],
        }),
      ),
    );

    for (const proposal of run.proposals) {
      expect(proposal.rationale.length).toBeGreaterThan(10);
      expect(proposal.confidence).toBeGreaterThan(0);
      expect(proposal.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe("the Claude stub", () => {
  it("declares itself unimplemented rather than pretending", () => {
    expect(claudeStubAdapter.implemented).toBe(false);
  });

  it("returns no proposals and explains what is missing", async () => {
    const run = await claudeStubAdapter.review(
      context(snapshot({ relationships: [relationship()] })),
    );

    expect(run.proposals).toHaveLength(0);
    expect(run.stoppedBecause).toBe("ERROR");
    expect(run.error).toContain("Not implemented");
    // The three unresolved questions, named in the failure itself.
    expect(run.error).toContain("API key");
    expect(run.error).toContain("cost");
    expect(run.error).toContain("approves");
  });

  it("costs nothing when it cannot run", async () => {
    const run = await claudeStubAdapter.review(context(snapshot()));
    expect(run.cost.estimatedCents).toBe(0);
  });
});

describe("the safety property that matters", () => {
  it("gives an adapter no way to change anything", async () => {
    // The contract returns proposals and nothing else. There is no database
    // handle on AgentContext, no callback, and no write method on the
    // interface — so an agent cannot act, only suggest, and a person approving
    // a suggestion goes through the same permission checks as any other write.
    const run = await rulesAgentAdapter.review(
      context(snapshot({ relationships: [relationship()] })),
    );

    expect(Object.keys(run)).not.toContain("applied");
    expect(run).toHaveProperty("proposals");
    for (const adapter of AGENT_ADAPTERS) {
      expect(Object.keys(adapter)).not.toContain("apply");
      expect(Object.keys(adapter)).not.toContain("execute");
    }
  });
});
