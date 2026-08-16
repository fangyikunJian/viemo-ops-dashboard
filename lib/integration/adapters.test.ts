import { describe, expect, it } from "vitest";
import {
  ADAPTERS,
  findAdapter,
  jiraStubAdapter,
  jsonExportAdapter,
} from "./adapters";
import { supports } from "./types";
import type { OutboundProject, OutboundSnapshot } from "./types";

const project: OutboundProject = {
  id: "p1",
  name: "Brightpath Scheduling",
  description: null,
  status: "ACTIVE",
  startDate: null,
  dueDate: "2026-09-01T00:00:00.000Z",
  leadName: "Shanice Boateng",
  relationshipName: "Brightpath Health",
  tags: ["health"],
  tasks: [
    {
      id: "t1",
      title: "Calendar view",
      status: "DONE",
      priority: "HIGH",
      dueDate: null,
      assigneeName: "Dmitri Volkov",
    },
  ],
};

const snapshot: OutboundSnapshot = {
  takenAt: "2026-08-17T00:00:00.000Z",
  projects: [project],
  relationships: [
    {
      id: "r1",
      name: "Brightpath Health",
      type: "CUSTOMER",
      status: "ACTIVE",
      cadenceDays: 14,
      lastContactAt: "2026-08-01T00:00:00.000Z",
      ownerName: "Shanice Boateng",
      organisationName: "Brightpath Health",
      tags: ["health"],
      interactionCount: 6,
    },
  ],
};

describe("the adapter registry", () => {
  it("finds an adapter by id", () => {
    expect(findAdapter("json-export")).toBe(jsonExportAdapter);
    expect(findAdapter("jira")).toBe(jiraStubAdapter);
  });

  it("returns nothing for an unknown id rather than throwing", () => {
    expect(findAdapter("salesforce")).toBeUndefined();
  });

  it("gives every adapter a unique id", () => {
    const ids = ADAPTERS.map((adapter) => adapter.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only declares a capability it has a method for", () => {
    // Guards the contract: `capabilities` is what callers check before calling,
    // so a declared capability with no method behind it would be a runtime
    // crash rather than a handled failure.
    for (const adapter of ADAPTERS) {
      if (supports(adapter, "push-projects")) {
        expect(adapter.pushProject).toBeTypeOf("function");
      }
      if (supports(adapter, "push-relationships")) {
        expect(adapter.pushRelationship).toBeTypeOf("function");
      }
      if (
        supports(adapter, "export-projects") ||
        supports(adapter, "export-relationships")
      ) {
        expect(adapter.exportSnapshot).toBeTypeOf("function");
      }
    }
  });
});

describe("the JSON export adapter", () => {
  it("serialises the whole snapshot", async () => {
    const result = await jsonExportAdapter.exportSnapshot!(snapshot);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = JSON.parse(result.payload as string) as OutboundSnapshot;
    expect(parsed.projects).toHaveLength(1);
    expect(parsed.relationships).toHaveLength(1);
    expect(parsed.projects[0].tasks[0].title).toBe("Calendar view");
  });

  it("reports what it exported", async () => {
    const result = await jsonExportAdapter.exportSnapshot!(snapshot);
    expect(result.ok && result.detail).toContain("1 projects");
  });

  it("handles an empty snapshot without failing", async () => {
    const result = await jsonExportAdapter.exportSnapshot!({
      takenAt: snapshot.takenAt,
      projects: [],
      relationships: [],
    });
    expect(result.ok).toBe(true);
  });
});

describe("the Jira stub", () => {
  it("declares itself unimplemented rather than pretending", () => {
    expect(jiraStubAdapter.implemented).toBe(false);
  });

  it("fails with an explanation of what is missing, not a crash", async () => {
    const result = await jiraStubAdapter.pushProject!(project);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("not implemented");
    expect(result.error).toContain(project.name);
  });
});
