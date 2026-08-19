/**
 * The audit trail.
 *
 * Answers "who changed this, and when" — the question every compliance
 * assessment asks and the one the system could not answer before. See
 * docs/compliance-and-standards.md §3, APP 11.
 *
 * Three properties this module exists to hold:
 *
 * **Append-only.** Nothing here updates or deletes an entry. A trail that can
 * be rewritten answers no question worth asking.
 *
 * **Self-contained entries.** The actor's name and role, and the record's
 * label, are copied into the row rather than joined at read time. That is
 * deliberate duplication: an entry that goes blank when the account or the
 * record is deleted is useless at exactly the moment someone needs it. The
 * foreign key is kept alongside for the cases where the target still exists.
 *
 * **Written in the same transaction as the change, wherever the change already
 * runs in one.** An audit row committed separately can be lost by a crash in
 * between, leaving a change nobody appears to have made. Where an action is a
 * single Prisma call, `recordAudit` runs immediately after and the window is
 * one statement wide — noted here rather than hidden, because it is the
 * remaining gap.
 */

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import type { AuditAction } from "./vocabulary";

export * from "./vocabulary";

type Tx = Prisma.TransactionClient;

export type AuditInput = {
  /** Null for anything the system did on its own. */
  actor: Pick<SessionUser, "id" | "name" | "role"> | null;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  /** The record's name as at the time. Copied, not joined. */
  resourceLabel?: string | null;
  /** One line a person can read without decoding anything. */
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

function toRow(input: AuditInput) {
  return {
    actorUserId: input.actor?.id ?? null,
    actorName: input.actor?.name ?? "System",
    actorRole: input.actor?.role ?? "SYSTEM",
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    resourceLabel: input.resourceLabel ?? null,
    summary: input.summary,
    metadata: input.metadata,
  };
}

/**
 * Write an entry inside an existing transaction.
 *
 * Preferred wherever the action already opens one: the change and the record
 * of it then commit or roll back together, and there is no window in which one
 * exists without the other.
 */
export async function recordAuditIn(tx: Tx, input: AuditInput): Promise<void> {
  await tx.auditEvent.create({ data: toRow(input) });
}

/**
 * Write an entry on its own.
 *
 * Deliberately never throws. A failure to record an audit entry must not undo
 * a change the user has already been told succeeded — that trades a missing log
 * line for a confusing lie about what happened. It is logged loudly instead.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditEvent.create({ data: toRow(input) });
  } catch (error) {
    console.error("AUDIT WRITE FAILED", { input, error });
  }
}

