/**
 * Project health — the PM module's derived signals.
 *
 * Progress, lateness and risk are computed from tasks and dates rather than
 * stored, so they can never drift out of step with the records they describe.
 * Pure functions of their inputs and an explicit `now`, for the same reasons as
 * lib/brm/cadence.ts.
 */

import { differenceInCalendarDays } from "date-fns";
import {
  LIVE_PROJECT_STATUSES,
  TASK_STATUSES,
  type ProjectStatus,
  type TaskStatus,
} from "@/lib/domain/enums";

/** How near a due date has to be before the board calls a project due soon. */
const DUE_SOON_DAYS = 7;

/**
 * Statuses for which risk is worth raising. A project ON_HOLD is excluded
 * deliberately: pausing it is a decision the team has already taken and
 * recorded, so re-reporting it as a risk asks them to act on their own choice
 * and dilutes the projects that genuinely need attention.
 */
const RISK_BEARING_STATUSES: readonly ProjectStatus[] = ["PLANNING", "ACTIVE"];

export type ProjectHealthInput = {
  status: ProjectStatus | string;
  dueDate: Date | null;
  tasks: readonly { status: TaskStatus | string }[];
};

export type TaskCounts = Record<TaskStatus, number> & { total: number };

export type ProjectHealthResult = {
  status: ProjectStatus;
  /** Fraction of tasks complete, 0 to 1. Zero for a project with no tasks. */
  progress: number;
  taskCounts: TaskCounts;
  /** Days until the due date; negative once passed. Null without a due date. */
  daysUntilDue: number | null;
  /** Past its due date and not yet closed out. A statement of fact. */
  isOverdue: boolean;
  isDueSoon: boolean;
  /** Needs someone to act. A judgement, and narrower than isOverdue. */
  isAtRisk: boolean;
  /** Why it is at risk, in the words the board displays. Empty if it is not. */
  riskReasons: string[];
};

function emptyTaskCounts(): TaskCounts {
  const counts = { total: 0 } as TaskCounts;
  for (const status of TASK_STATUSES) counts[status] = 0;
  return counts;
}

function countTasks(
  tasks: readonly { status: TaskStatus | string }[],
): TaskCounts {
  const counts = emptyTaskCounts();
  for (const task of tasks) {
    const status = task.status as TaskStatus;
    if (status in counts) counts[status] += 1;
    counts.total += 1;
  }
  return counts;
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function computeProjectHealth(
  input: ProjectHealthInput,
  now: Date = new Date(),
): ProjectHealthResult {
  const status = input.status as ProjectStatus;
  const taskCounts = countTasks(input.tasks);

  const progress =
    taskCounts.total === 0 ? 0 : taskCounts.DONE / taskCounts.total;

  const isLive = LIVE_PROJECT_STATUSES.includes(status);
  const daysUntilDue = input.dueDate
    ? differenceInCalendarDays(input.dueDate, now)
    : null;

  const isOverdue = isLive && daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon =
    isLive &&
    daysUntilDue !== null &&
    daysUntilDue >= 0 &&
    daysUntilDue <= DUE_SOON_DAYS;

  const riskReasons: string[] = [];
  if (RISK_BEARING_STATUSES.includes(status)) {
    if (isOverdue && daysUntilDue !== null) {
      riskReasons.push(`Overdue by ${plural(-daysUntilDue, "day")}`);
    }
    if (taskCounts.BLOCKED > 0) {
      riskReasons.push(plural(taskCounts.BLOCKED, "blocked task"));
    }
  }

  return {
    status,
    progress,
    taskCounts,
    daysUntilDue,
    isOverdue,
    isDueSoon,
    isAtRisk: riskReasons.length > 0,
    riskReasons,
  };
}

export type ProjectHealthSummary = {
  total: number;
  /** Projects still in flight — planning, active or on hold. */
  live: number;
  atRisk: number;
  overdue: number;
  dueSoon: number;
  byStatus: Record<ProjectStatus, number>;
};

export function summariseProjectHealth(
  results: readonly ProjectHealthResult[],
): ProjectHealthSummary {
  const byStatus = {
    PLANNING: 0,
    ACTIVE: 0,
    ON_HOLD: 0,
    DONE: 0,
    CANCELLED: 0,
  } satisfies Record<ProjectStatus, number>;

  const summary: ProjectHealthSummary = {
    total: results.length,
    live: 0,
    atRisk: 0,
    overdue: 0,
    dueSoon: 0,
    byStatus,
  };

  for (const result of results) {
    if (result.status in byStatus) byStatus[result.status] += 1;
    if (LIVE_PROJECT_STATUSES.includes(result.status)) summary.live += 1;
    if (result.isAtRisk) summary.atRisk += 1;
    if (result.isOverdue) summary.overdue += 1;
    if (result.isDueSoon) summary.dueSoon += 1;
  }

  return summary;
}

/** Progress as a rounded percentage, for labels and progress bars. */
export function progressPercent(result: ProjectHealthResult): number {
  return Math.round(result.progress * 100);
}
