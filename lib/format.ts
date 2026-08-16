/**
 * Date and number formatting.
 *
 * Australian conventions throughout — day before month — because that is what
 * the client reads. Formatting lives in one module so a date never appears in
 * one style on one screen and another style on the next.
 */

import { differenceInCalendarDays } from "date-fns";

const DATE = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_NO_YEAR = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
});

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return DATE.format(date);
}

/** Drops the year for dates inside the current one, which is most of them. */
export function formatDateCompact(
  date: Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!date) return "—";
  return date.getFullYear() === now.getFullYear()
    ? DATE_NO_YEAR.format(date)
    : DATE.format(date);
}

/** "in 5 days" / "3 days ago" / "today". */
export function formatRelativeDate(
  date: Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!date) return "—";
  const days = differenceInCalendarDays(date, now);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return `in ${days} days`;
  return `${-days} days ago`;
}

/** "5 days" / "1 day" — a bare duration, for phrases that supply their own verb. */
export function formatDays(days: number): string {
  const n = Math.abs(days);
  return `${n} ${n === 1 ? "day" : "days"}`;
}

/** Turns a Date into the value an `<input type="date">` expects. */
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Reads a date out of a form. An empty string means "no date", which is
 * different from an invalid one — the caller needs to be able to tell them
 * apart, so the empty case returns null and a malformed one returns undefined.
 */
export function fromDateInputValue(
  value: FormDataEntryValue | null,
): Date | null | undefined {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
