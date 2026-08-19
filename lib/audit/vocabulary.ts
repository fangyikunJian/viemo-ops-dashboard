/**
 * The audit vocabulary, and the pure functions over it.
 *
 * Separated from record.ts so that importing any of this does not drag in the
 * Prisma client — the same split as lib/auth/password-rules.ts, and for the
 * same reason: a module that only describes data should not require a database
 * connection to load, and the failure when it does is confusing.
 */

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "ARCHIVE",
  "RESTORE",
  "DELETE",
  "SIGN_IN",
  "SIGN_IN_FAILED",
  "SIGN_OUT",
  "ROLE_CHANGE",
  "DEACTIVATE",
  "REACTIVATE",
  "EXPORT",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Created",
  UPDATE: "Edited",
  ARCHIVE: "Archived",
  RESTORE: "Restored",
  DELETE: "Deleted",
  SIGN_IN: "Signed in",
  SIGN_IN_FAILED: "Failed sign-in",
  SIGN_OUT: "Signed out",
  ROLE_CHANGE: "Changed role",
  DEACTIVATE: "Deactivated",
  REACTIVATE: "Reactivated",
  EXPORT: "Exported",
};

/** Actions that should stand out in the list — they destroy or grant. */
export const HIGH_IMPACT_ACTIONS: readonly AuditAction[] = [
  "DELETE",
  "ROLE_CHANGE",
  "DEACTIVATE",
  "EXPORT",
  "SIGN_IN_FAILED",
];

/**
 * Describe what changed between two versions of a record.
 *
 * Returns the fields whose values differ, with both sides, so an entry can say
 * "status: ACTIVE → DORMANT" rather than the useless "record was edited".
 * Values are stringified because the trail is read by people, not replayed.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: readonly (keyof T)[],
): { changed: string[]; metadata: Record<string, { from: string; to: string }> } {
  const changed: string[] = [];
  const metadata: Record<string, { from: string; to: string }> = {};

  for (const field of fields) {
    const from = normalise(before[field]);
    const to = normalise(after[field]);
    if (from === to) continue;
    changed.push(String(field));
    metadata[String(field)] = { from, to };
  }

  return { changed, metadata };
}

function normalise(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** "status, cadenceDays and owner" — for the summary line. */
export function listFields(fields: readonly string[]): string {
  if (fields.length === 0) return "nothing";
  if (fields.length === 1) return fields[0];
  return `${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]}`;
}
