/**
 * Reads for the Project Management module. Never imports from lib/brm — the two
 * modules meet only in lib/dashboard and through nullable foreign keys.
 */

import { prisma } from "@/lib/db";
import {
  computeProjectHealth,
  type ProjectHealthResult,
} from "./project-health";
import { LIVE_PROJECT_STATUSES, type ProjectStatus } from "@/lib/domain/enums";

export type ProjectFilters = {
  status?: string;
  lead?: string;
  risk?: string;
  q?: string;
};

export type ProjectListRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  leadName: string;
  relationshipId: string | null;
  relationshipName: string | null;
  tags: { id: string; label: string }[];
  health: ProjectHealthResult;
};

export async function listProjects(
  filters: ProjectFilters = {},
  now: Date = new Date(),
): Promise<ProjectListRow[]> {
  const rows = await prisma.project.findMany({
    where: {
      status: filters.status || undefined,
      leadId: filters.lead || undefined,
      name: filters.q ? { contains: filters.q } : undefined,
    },
    orderBy: [{ dueDate: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      dueDate: true,
      lead: { select: { name: true } },
      relationship: { select: { id: true, name: true } },
      tags: { select: { id: true, label: true }, orderBy: { label: "asc" } },
      tasks: { select: { status: true } },
    },
  });

  const mapped: ProjectListRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    dueDate: row.dueDate,
    leadName: row.lead.name,
    relationshipId: row.relationship?.id ?? null,
    relationshipName: row.relationship?.name ?? null,
    tags: row.tags,
    health: computeProjectHealth(row, now),
  }));

  // Risk is derived, so it is filtered here rather than in SQL.
  if (filters.risk === "at-risk") {
    return mapped.filter((row) => row.health.isAtRisk);
  }
  if (filters.risk === "live") {
    return mapped.filter((row) =>
      LIVE_PROJECT_STATUSES.includes(row.status as ProjectStatus),
    );
  }

  return mapped;
}

export async function getProject(id: string, now: Date = new Date()) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true } },
      relationship: {
        select: { id: true, name: true, type: true, status: true },
      },
      tags: { orderBy: { label: "asc" } },
      tasks: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: { assignee: { select: { id: true, name: true } } },
      },
      interactions: {
        orderBy: { occurredAt: "desc" },
        take: 5,
        include: {
          relationship: { select: { id: true, name: true } },
          loggedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!project) return null;

  return { ...project, health: computeProjectHealth(project, now) };
}

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProject>>>;

/** Reference data the project and task forms need. */
export async function getProjectFormOptions() {
  const [teamMembers, relationships] = await Promise.all([
    prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.relationship.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
  ]);

  return { teamMembers, relationships };
}

/** Counts for the filter chips on the list screen. */
export async function countProjects(now: Date = new Date()) {
  const rows = await listProjects({}, now);
  return {
    total: rows.length,
    atRisk: rows.filter((row) => row.health.isAtRisk).length,
    live: rows.filter((row) =>
      LIVE_PROJECT_STATUSES.includes(row.status as ProjectStatus),
    ).length,
  };
}
