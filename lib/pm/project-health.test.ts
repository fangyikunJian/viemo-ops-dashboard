import { describe, expect, it } from "vitest";
import {
  computeProjectHealth,
  summariseProjectHealth,
  type ProjectHealthInput,
} from "./project-health";
import type { ProjectStatus, TaskStatus } from "@/lib/domain/enums";

const NOW = new Date("2026-08-17T10:00:00.000Z");

function daysFromNow(n: number): Date {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function tasks(...statuses: TaskStatus[]) {
  return statuses.map((status) => ({ status }));
}

function project(
  overrides: Partial<ProjectHealthInput> = {},
): ProjectHealthInput {
  return {
    status: "ACTIVE" as ProjectStatus,
    dueDate: null,
    tasks: [],
    ...overrides,
  };
}

describe("computeProjectHealth", () => {
  describe("progress", () => {
    it("is the share of tasks that are done", () => {
      const result = computeProjectHealth(
        project({ tasks: tasks("DONE", "DONE", "TODO", "IN_PROGRESS") }),
        NOW,
      );

      expect(result.progress).toBe(0.5);
      expect(result.taskCounts.DONE).toBe(2);
      expect(result.taskCounts.total).toBe(4);
    });

    it("is zero for a project with no tasks rather than dividing by zero", () => {
      const result = computeProjectHealth(project({ tasks: [] }), NOW);

      expect(result.progress).toBe(0);
      expect(result.taskCounts.total).toBe(0);
    });

    it("is one when every task is done", () => {
      const result = computeProjectHealth(
        project({ tasks: tasks("DONE", "DONE") }),
        NOW,
      );

      expect(result.progress).toBe(1);
    });
  });

  describe("overdue", () => {
    it("is overdue once the due date has passed", () => {
      const result = computeProjectHealth(
        project({ dueDate: daysFromNow(-3) }),
        NOW,
      );

      expect(result.isOverdue).toBe(true);
      expect(result.daysUntilDue).toBe(-3);
    });

    it("is not overdue on the due date itself", () => {
      const result = computeProjectHealth(
        project({ dueDate: daysFromNow(0) }),
        NOW,
      );

      expect(result.isOverdue).toBe(false);
      expect(result.daysUntilDue).toBe(0);
    });

    it("is not overdue without a due date", () => {
      const result = computeProjectHealth(project({ dueDate: null }), NOW);

      expect(result.isOverdue).toBe(false);
      expect(result.daysUntilDue).toBeNull();
    });

    it("is never overdue once delivered, however late it was", () => {
      const result = computeProjectHealth(
        project({ status: "DONE", dueDate: daysFromNow(-90) }),
        NOW,
      );

      expect(result.isOverdue).toBe(false);
    });

    it("is never overdue once cancelled", () => {
      const result = computeProjectHealth(
        project({ status: "CANCELLED", dueDate: daysFromNow(-90) }),
        NOW,
      );

      expect(result.isOverdue).toBe(false);
    });

    it("reports a paused project as overdue, because it factually is", () => {
      const result = computeProjectHealth(
        project({ status: "ON_HOLD", dueDate: daysFromNow(-10) }),
        NOW,
      );

      expect(result.isOverdue).toBe(true);
    });
  });

  describe("due soon", () => {
    it("flags a project due inside a week", () => {
      const result = computeProjectHealth(
        project({ dueDate: daysFromNow(5) }),
        NOW,
      );

      expect(result.isDueSoon).toBe(true);
    });

    it("does not flag a project due further out", () => {
      const result = computeProjectHealth(
        project({ dueDate: daysFromNow(20) }),
        NOW,
      );

      expect(result.isDueSoon).toBe(false);
    });

    it("does not flag an already overdue project as due soon", () => {
      const result = computeProjectHealth(
        project({ dueDate: daysFromNow(-2) }),
        NOW,
      );

      expect(result.isDueSoon).toBe(false);
      expect(result.isOverdue).toBe(true);
    });
  });

  describe("risk", () => {
    it("is at risk when overdue", () => {
      const result = computeProjectHealth(
        project({ dueDate: daysFromNow(-3) }),
        NOW,
      );

      expect(result.isAtRisk).toBe(true);
      expect(result.riskReasons).toContain("Overdue by 3 days");
    });

    it("is at risk when any task is blocked", () => {
      const result = computeProjectHealth(
        project({ tasks: tasks("TODO", "BLOCKED") }),
        NOW,
      );

      expect(result.isAtRisk).toBe(true);
      expect(result.riskReasons).toContain("1 blocked task");
    });

    it("pluralises multiple blocked tasks", () => {
      const result = computeProjectHealth(
        project({ tasks: tasks("BLOCKED", "BLOCKED", "DONE") }),
        NOW,
      );

      expect(result.riskReasons).toContain("2 blocked tasks");
    });

    it("reports every reason it is at risk, not just the first", () => {
      const result = computeProjectHealth(
        project({ dueDate: daysFromNow(-1), tasks: tasks("BLOCKED") }),
        NOW,
      );

      expect(result.riskReasons).toHaveLength(2);
    });

    it("is not at risk when on schedule and unblocked", () => {
      const result = computeProjectHealth(
        project({ dueDate: daysFromNow(30), tasks: tasks("TODO", "DONE") }),
        NOW,
      );

      expect(result.isAtRisk).toBe(false);
      expect(result.riskReasons).toEqual([]);
    });

    it("does not flag a deliberately paused project as at risk", () => {
      // Being on hold is a decision that has already been taken and recorded.
      // Surfacing it as a risk would ask the team to act on something they
      // chose, and would drown the projects that genuinely need attention.
      const result = computeProjectHealth(
        project({
          status: "ON_HOLD",
          dueDate: daysFromNow(-10),
          tasks: tasks("BLOCKED"),
        }),
        NOW,
      );

      expect(result.isAtRisk).toBe(false);
    });

    it("does not flag a delivered project as at risk", () => {
      const result = computeProjectHealth(
        project({ status: "DONE", dueDate: daysFromNow(-10) }),
        NOW,
      );

      expect(result.isAtRisk).toBe(false);
    });
  });
});

describe("summariseProjectHealth", () => {
  it("counts live, at-risk and delivered projects for the dashboard", () => {
    const results = [
      computeProjectHealth(project({ status: "ACTIVE" }), NOW),
      computeProjectHealth(
        project({ status: "ACTIVE", dueDate: daysFromNow(-5) }),
        NOW,
      ),
      computeProjectHealth(project({ status: "PLANNING" }), NOW),
      computeProjectHealth(project({ status: "ON_HOLD" }), NOW),
      computeProjectHealth(project({ status: "DONE" }), NOW),
      computeProjectHealth(project({ status: "CANCELLED" }), NOW),
    ];

    const summary = summariseProjectHealth(results);

    expect(summary.total).toBe(6);
    expect(summary.live).toBe(4);
    expect(summary.atRisk).toBe(1);
    expect(summary.overdue).toBe(1);
    expect(summary.byStatus.ACTIVE).toBe(2);
    expect(summary.byStatus.DONE).toBe(1);
  });
});
