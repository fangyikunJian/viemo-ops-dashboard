/**
 * Reads for the BRM module. Never imports from lib/pm — anything needing both
 * modules belongs in lib/dashboard.
 */

import { prisma } from "@/lib/db";
import { CADENCE_SEVERITY, computeCadence, type CadenceResult } from "./cadence";
import type { CadenceStatus } from "@/lib/domain/enums";

export type RelationshipFilters = {
  type?: string;
  status?: string;
  cadence?: string;
  owner?: string;
  q?: string;
};

export type RelationshipListRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  cadenceDays: number | null;
  ownerName: string;
  organisationName: string | null;
  interactionCount: number;
  projectCount: number;
  cadence: CadenceResult;
};

export async function listRelationships(
  filters: RelationshipFilters = {},
  now: Date = new Date(),
): Promise<RelationshipListRow[]> {
  const rows = await prisma.relationship.findMany({
    where: {
      type: filters.type || undefined,
      status: filters.status || undefined,
      ownerId: filters.owner || undefined,
      name: filters.q ? { contains: filters.q } : undefined,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      cadenceDays: true,
      lastContactAt: true,
      createdAt: true,
      owner: { select: { name: true } },
      organisation: { select: { name: true } },
      _count: { select: { interactions: true, projects: true } },
    },
  });

  const mapped: RelationshipListRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    cadenceDays: row.cadenceDays,
    ownerName: row.owner.name,
    organisationName: row.organisation?.name ?? null,
    interactionCount: row._count.interactions,
    projectCount: row._count.projects,
    cadence: computeCadence(row, now),
  }));

  // Cadence is derived, so it cannot be filtered or ordered in SQL.
  const filtered = filters.cadence
    ? mapped.filter((row) => row.cadence.status === filters.cadence)
    : mapped;

  return filtered.sort((a, b) => {
    const bySeverity =
      CADENCE_SEVERITY[b.cadence.status] - CADENCE_SEVERITY[a.cadence.status];
    if (bySeverity !== 0) return bySeverity;
    return a.name.localeCompare(b.name);
  });
}

export async function getRelationship(id: string, now: Date = new Date()) {
  const relationship = await prisma.relationship.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      organisation: { select: { id: true, name: true, website: true } },
      contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      tags: { orderBy: { label: "asc" } },
      interactions: {
        orderBy: { occurredAt: "desc" },
        include: {
          loggedBy: { select: { name: true } },
          project: { select: { id: true, name: true } },
        },
      },
      projects: {
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          tasks: { select: { status: true } },
        },
      },
    },
  });

  if (!relationship) return null;

  return { ...relationship, cadence: computeCadence(relationship, now) };
}

export type RelationshipDetail = NonNullable<
  Awaited<ReturnType<typeof getRelationship>>
>;

/** Counts by cadence status, for the filter chips on the list screen. */
export async function countByCadence(
  now: Date = new Date(),
): Promise<Record<CadenceStatus, number>> {
  const rows = await prisma.relationship.findMany({
    select: {
      cadenceDays: true,
      lastContactAt: true,
      status: true,
      createdAt: true,
    },
  });

  const counts: Record<CadenceStatus, number> = {
    OVERDUE: 0,
    DUE_SOON: 0,
    ON_TRACK: 0,
    NOT_TRACKED: 0,
  };

  for (const row of rows) counts[computeCadence(row, now).status] += 1;
  return counts;
}

/** Reference data the relationship form needs. */
export async function getRelationshipFormOptions() {
  const [teamMembers, organisations, projects] = await Promise.all([
    prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.organisation.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.project.findMany({
      where: { status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { teamMembers, organisations, projects };
}
