/**
 * Reads over the audit trail.
 *
 * Paginated by default. The trail is the one table in this system that only
 * grows, so it is also the one place where loading everything is guaranteed to
 * stop working — the rest of the application gets away with it because a
 * venture studio has tens of relationships, not tens of thousands of events.
 */

import { prisma } from "@/lib/db";
import type { AuditAction } from "./vocabulary";

export type AuditFilters = {
  action?: string;
  resource?: string;
  actorUserId?: string;
};

export type AuditRow = {
  id: string;
  occurredAt: Date;
  actorName: string;
  actorRole: string;
  actorUserId: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  resourceLabel: string | null;
  summary: string;
  metadata: unknown;
};

export const AUDIT_PAGE_SIZE = 50;

export async function listAuditEvents(
  filters: AuditFilters = {},
  page = 0,
): Promise<{ rows: AuditRow[]; total: number; hasMore: boolean }> {
  const where = {
    action: filters.action || undefined,
    resource: filters.resource || undefined,
    actorUserId: filters.actorUserId || undefined,
  };

  const [rows, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: page * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
    }),
    prisma.auditEvent.count({ where }),
  ]);

  return {
    rows: rows as AuditRow[],
    total,
    hasMore: (page + 1) * AUDIT_PAGE_SIZE < total,
  };
}

/** Every event touching one record, for the "history" panel on its page. */
export async function historyFor(
  resource: string,
  resourceId: string,
  take = 20,
): Promise<AuditRow[]> {
  const rows = await prisma.auditEvent.findMany({
    where: { resource, resourceId },
    orderBy: { occurredAt: "desc" },
    take,
  });
  return rows as AuditRow[];
}

/** Counts for the filter chips, so a filter that would show nothing is visible. */
export async function auditSummary() {
  const [byAction, byResource, actors, total] = await Promise.all([
    prisma.auditEvent.groupBy({ by: ["action"], _count: true }),
    prisma.auditEvent.groupBy({ by: ["resource"], _count: true }),
    prisma.auditEvent.groupBy({
      by: ["actorUserId", "actorName"],
      _count: true,
      orderBy: { _count: { actorUserId: "desc" } },
      take: 10,
    }),
    prisma.auditEvent.count(),
  ]);

  return {
    total,
    byAction: Object.fromEntries(byAction.map((r) => [r.action, r._count])),
    byResource: Object.fromEntries(byResource.map((r) => [r.resource, r._count])),
    actors: actors.map((a) => ({
      id: a.actorUserId,
      name: a.actorName,
      count: a._count,
    })),
  };
}
