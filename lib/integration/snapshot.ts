/**
 * Turning the database into the plain shape adapters consume.
 *
 * This is the only place that knows both the Prisma models and the outbound
 * types, which keeps every adapter free of database concerns — an adapter can
 * be written and tested against literal objects.
 */

import { prisma } from "@/lib/db";
import type {
  OutboundProject,
  OutboundRelationship,
  OutboundSnapshot,
} from "./types";
import type {
  ProjectStatus,
  RelationshipStatus,
  RelationshipType,
  TaskPriority,
  TaskStatus,
} from "@/lib/domain/enums";

function isoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

export async function buildSnapshot(
  now: Date = new Date(),
): Promise<OutboundSnapshot> {
  const [projects, relationships] = await Promise.all([
    prisma.project.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        dueDate: true,
        lead: { select: { name: true } },
        relationship: { select: { name: true } },
        tags: { select: { label: true } },
        tasks: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: { select: { name: true } },
          },
        },
      },
    }),
    prisma.relationship.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        cadenceDays: true,
        lastContactAt: true,
        owner: { select: { name: true } },
        organisation: { select: { name: true } },
        tags: { select: { label: true } },
        _count: { select: { interactions: true } },
      },
    }),
  ]);

  return {
    takenAt: now.toISOString(),
    projects: projects.map(
      (project): OutboundProject => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status as ProjectStatus,
        startDate: isoOrNull(project.startDate),
        dueDate: isoOrNull(project.dueDate),
        leadName: project.lead.name,
        relationshipName: project.relationship?.name ?? null,
        tags: project.tags.map((tag) => tag.label),
        tasks: project.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status as TaskStatus,
          priority: task.priority as TaskPriority,
          dueDate: isoOrNull(task.dueDate),
          assigneeName: task.assignee?.name ?? null,
        })),
      }),
    ),
    relationships: relationships.map(
      (relationship): OutboundRelationship => ({
        id: relationship.id,
        name: relationship.name,
        type: relationship.type as RelationshipType,
        status: relationship.status as RelationshipStatus,
        cadenceDays: relationship.cadenceDays,
        lastContactAt: isoOrNull(relationship.lastContactAt),
        ownerName: relationship.owner.name,
        organisationName: relationship.organisation?.name ?? null,
        tags: relationship.tags.map((tag) => tag.label),
        interactionCount: relationship._count.interactions,
      }),
    ),
  };
}
