/**
 * Cross-module reads.
 *
 * lib/brm and lib/pm never import each other. Anything that needs both — which
 * is to say, the dashboard — is assembled here. Keeping the join in one module
 * is what lets the two module teams work in parallel without their queries
 * growing into each other.
 */

import { prisma } from "@/lib/db";
import {
  CADENCE_SEVERITY,
  computeCadence,
  summariseCadence,
  type CadenceResult,
} from "@/lib/brm/cadence";
import {
  computeProjectHealth,
  summariseProjectHealth,
  type ProjectHealthResult,
} from "@/lib/pm/project-health";
import {
  PROJECT_STATUS_TERMS,
  RELATIONSHIP_TYPE_TERMS,
  RELATIONSHIP_TYPES,
  PROJECT_STATUSES,
  type ProjectStatus,
  type RelationshipType,
} from "@/lib/domain/enums";

export type AttentionRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  ownerName: string;
  cadence: CadenceResult;
};

export type RiskRow = {
  id: string;
  name: string;
  status: string;
  leadName: string;
  relationshipName: string | null;
  health: ProjectHealthResult;
};

export type UpcomingTaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date;
  projectId: string;
  projectName: string;
  assigneeName: string | null;
};

export type RecentInteractionRow = {
  id: string;
  occurredAt: Date;
  channel: string;
  summary: string;
  relationshipId: string;
  relationshipName: string;
  projectName: string | null;
  loggedByName: string;
};

export async function getDashboardData(now: Date = new Date()) {
  const [relationships, projects, upcomingTasks, recentInteractions] =
    await Promise.all([
      prisma.relationship.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          cadenceDays: true,
          lastContactAt: true,
          createdAt: true,
          owner: { select: { name: true } },
        },
      }),
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          lead: { select: { name: true } },
          relationship: { select: { name: true } },
          tasks: { select: { status: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          status: { not: "DONE" },
          dueDate: { not: null },
          project: { status: { in: ["PLANNING", "ACTIVE"] } },
        },
        orderBy: { dueDate: "asc" },
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
          assignee: { select: { name: true } },
        },
      }),
      prisma.interaction.findMany({
        orderBy: { occurredAt: "desc" },
        take: 6,
        select: {
          id: true,
          occurredAt: true,
          channel: true,
          summary: true,
          relationship: { select: { id: true, name: true } },
          project: { select: { name: true } },
          loggedBy: { select: { name: true } },
        },
      }),
    ]);

  // ── Relationship health ─────────────────────────────────────────
  const withCadence: AttentionRow[] = relationships.map((relationship) => ({
    id: relationship.id,
    name: relationship.name,
    type: relationship.type,
    status: relationship.status,
    ownerName: relationship.owner.name,
    cadence: computeCadence(relationship, now),
  }));

  const cadenceSummary = summariseCadence(withCadence.map((r) => r.cadence));

  const needsAttention = withCadence
    .filter(
      (row) =>
        row.cadence.status === "OVERDUE" || row.cadence.status === "DUE_SOON",
    )
    .sort((a, b) => {
      const bySeverity =
        CADENCE_SEVERITY[b.cadence.status] - CADENCE_SEVERITY[a.cadence.status];
      if (bySeverity !== 0) return bySeverity;
      return (b.cadence.daysOverdue ?? 0) - (a.cadence.daysOverdue ?? 0);
    });

  // ── Project health ──────────────────────────────────────────────
  const withHealth: RiskRow[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    status: project.status,
    leadName: project.lead.name,
    relationshipName: project.relationship?.name ?? null,
    health: computeProjectHealth(project, now),
  }));

  const projectSummary = summariseProjectHealth(withHealth.map((p) => p.health));

  const atRiskProjects = withHealth
    .filter((row) => row.health.isAtRisk)
    .sort(
      (a, b) =>
        (a.health.daysUntilDue ?? Number.MAX_SAFE_INTEGER) -
        (b.health.daysUntilDue ?? Number.MAX_SAFE_INTEGER),
    );

  // ── Breakdowns ──────────────────────────────────────────────────
  const relationshipsByType = RELATIONSHIP_TYPES.map((type) => ({
    label: RELATIONSHIP_TYPE_TERMS[type as RelationshipType].label,
    value: relationships.filter(
      (r) => r.type === type && r.status !== "ARCHIVED",
    ).length,
    href: `/relationships?type=${type}`,
  })).sort((a, b) => b.value - a.value);

  const projectsByStatus = PROJECT_STATUSES.map((status) => ({
    label: PROJECT_STATUS_TERMS[status as ProjectStatus].label,
    value: projects.filter((p) => p.status === status).length,
    href: `/projects?status=${status}`,
  })).filter((item) => item.value > 0);

  return {
    cadenceSummary,
    projectSummary,
    needsAttention,
    atRiskProjects,
    relationshipsByType,
    projectsByStatus,
    upcomingTasks: upcomingTasks
      .filter((task): task is typeof task & { dueDate: Date } =>
        Boolean(task.dueDate),
      )
      .map(
        (task): UpcomingTaskRow => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          projectId: task.project.id,
          projectName: task.project.name,
          assigneeName: task.assignee?.name ?? null,
        }),
      ),
    recentInteractions: recentInteractions.map(
      (interaction): RecentInteractionRow => ({
        id: interaction.id,
        occurredAt: interaction.occurredAt,
        channel: interaction.channel,
        summary: interaction.summary,
        relationshipId: interaction.relationship.id,
        relationshipName: interaction.relationship.name,
        projectName: interaction.project?.name ?? null,
        loggedByName: interaction.loggedBy.name,
      }),
    ),
    totals: {
      relationships: relationships.filter((r) => r.status !== "ARCHIVED").length,
      projects: projects.length,
    },
  };
}
