/**
 * Contact cadence — the BRM module's health signal.
 *
 * A CRM measures a deal's distance from closing. A relationship has no close,
 * so this module measures something else: whether the relationship is being
 * maintained at the rhythm the team agreed to maintain it at. That single idea
 * is what makes the BRM a different kind of system rather than a renamed CRM.
 *
 * Everything here is a pure function of its inputs and an explicit `now`. No
 * database, no clock reads, no I/O — which is what makes the behaviour testable
 * and the dashboard cheap to compute.
 */

import { addDays, differenceInCalendarDays } from "date-fns";
import {
  CADENCE_TRACKED_STATUSES,
  type CadenceStatus,
  type RelationshipStatus,
} from "@/lib/domain/enums";

/** The fraction of the cadence window during which we warn before it lapses. */
const WARNING_FRACTION = 0.2;

/**
 * Longest warning window, in days. Without a cap, a yearly cadence would spend
 * 73 days flagged as needing attention — long enough that the warning stops
 * carrying information.
 */
const MAX_WARNING_DAYS = 30;

export type CadenceInput = {
  cadenceDays: number | null;
  lastContactAt: Date | null;
  /**
   * Stored as String by SQLite; validated on write, so reads are trusted here
   * rather than re-parsed on every row.
   */
  status: RelationshipStatus | string;
  /** Fallback start of the clock for a relationship never yet contacted. */
  createdAt: Date;
};

export type CadenceResult = {
  status: CadenceStatus;
  /** When contact next falls due. Null when the relationship is not tracked. */
  dueAt: Date | null;
  /** Days until due; negative once the window has lapsed. */
  daysUntilDue: number | null;
  /** Days past due, or 0 while still inside the window. */
  daysOverdue: number | null;
  /** Days since the last substantive interaction, or null if there never was one. */
  daysSinceContact: number | null;
  hasEverBeenContacted: boolean;
};

/**
 * How many days before a cadence lapses the relationship starts showing as due
 * soon. A fifth of the window, never less than a day, never more than a month.
 */
export function cadenceThresholdDays(cadenceDays: number): number {
  const proportional = Math.ceil(cadenceDays * WARNING_FRACTION);
  return Math.min(MAX_WARNING_DAYS, Math.max(1, proportional));
}

/**
 * Work out where a relationship sits against its agreed contact rhythm.
 *
 * Two decisions worth knowing about:
 *
 * 1. A relationship with no cadence, or one resting in DORMANT or ARCHIVED, is
 *    NOT_TRACKED rather than overdue. The model draws a hard line between a
 *    relationship you have chosen to rest and one you are neglecting; collapsing
 *    the two would make the overdue count meaningless.
 * 2. When a relationship has never been contacted, the clock runs from when it
 *    was added. Adding it is what creates the obligation to make first contact,
 *    so a new prospect gets its full first window before it is chased.
 */
export function computeCadence(
  input: CadenceInput,
  now: Date = new Date(),
): CadenceResult {
  const { cadenceDays, lastContactAt, status, createdAt } = input;

  const hasEverBeenContacted = lastContactAt !== null;
  const daysSinceContact = lastContactAt
    ? differenceInCalendarDays(now, lastContactAt)
    : null;

  const isTrackedStatus = CADENCE_TRACKED_STATUSES.includes(
    status as RelationshipStatus,
  );
  const hasUsableCadence = cadenceDays !== null && cadenceDays > 0;

  if (!isTrackedStatus || !hasUsableCadence) {
    return {
      status: "NOT_TRACKED",
      dueAt: null,
      daysUntilDue: null,
      daysOverdue: null,
      daysSinceContact,
      hasEverBeenContacted,
    };
  }

  const clockStartedAt = lastContactAt ?? createdAt;
  const dueAt = addDays(clockStartedAt, cadenceDays);
  const daysUntilDue = differenceInCalendarDays(dueAt, now);

  const status_: CadenceStatus =
    daysUntilDue < 0
      ? "OVERDUE"
      : daysUntilDue <= cadenceThresholdDays(cadenceDays)
        ? "DUE_SOON"
        : "ON_TRACK";

  return {
    status: status_,
    dueAt,
    daysUntilDue,
    daysOverdue: Math.max(0, -daysUntilDue),
    daysSinceContact,
    hasEverBeenContacted,
  };
}

/**
 * Sort weight for cadence status. Higher sorts first, so a list ordered by this
 * puts the relationships needing attention at the top.
 */
export const CADENCE_SEVERITY: Record<CadenceStatus, number> = {
  OVERDUE: 3,
  DUE_SOON: 2,
  ON_TRACK: 1,
  NOT_TRACKED: 0,
};

export type CadenceSummary = Record<CadenceStatus, number> & { total: number };

/** Roll a set of cadence results up into the counts the dashboard displays. */
export function summariseCadence(
  results: readonly CadenceResult[],
): CadenceSummary {
  const summary: CadenceSummary = {
    OVERDUE: 0,
    DUE_SOON: 0,
    ON_TRACK: 0,
    NOT_TRACKED: 0,
    total: results.length,
  };

  for (const result of results) {
    summary[result.status] += 1;
  }

  return summary;
}

/**
 * Human phrasing for how long it has been. Kept beside the calculation so the
 * wording stays consistent everywhere it appears.
 */
export function describeLastContact(result: CadenceResult): string {
  if (!result.hasEverBeenContacted) return "Never contacted";
  const days = result.daysSinceContact ?? 0;
  if (days <= 0) return "Contacted today";
  if (days === 1) return "Contacted yesterday";
  if (days < 30) return `Contacted ${days} days ago`;
  const months = Math.round(days / 30);
  if (months === 1) return "Contacted about a month ago";
  if (months < 12) return `Contacted about ${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "Contacted about a year ago" : `Contacted over ${years} years ago`;
}
