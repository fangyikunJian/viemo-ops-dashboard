"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import {
  projectStatusSchema,
  taskPrioritySchema,
  taskStatusSchema,
} from "@/lib/domain/enums";
import { fromDateInputValue } from "@/lib/format";
import { recordAudit, diffFields, listFields } from "@/lib/audit/record";
import {
  fieldErrorsFrom,
  optionalText,
  tagLabels,
  text,
  type ActionState,
} from "@/lib/form-state";

const projectSchema = z
  .object({
    name: z.string().min(1, "Give the project a name.").max(160),
    description: z.string().max(4000).nullable(),
    status: projectStatusSchema,
    startDate: z.date().nullable(),
    dueDate: z.date().nullable(),
    leadId: z.string().min(1, "Choose who is leading this."),
    relationshipId: z.string().nullable(),
  })
  .refine(
    (value) =>
      !value.startDate || !value.dueDate || value.startDate <= value.dueDate,
    { message: "The due date cannot fall before the start date.", path: ["dueDate"] },
  );

const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "Give the task a title.").max(200),
  description: z.string().max(2000).nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.date().nullable(),
  assigneeId: z.string().nullable(),
});

// ═══════════════════════════════════════════════════════════════════
//  Projects
// ═══════════════════════════════════════════════════════════════════

export async function saveProjectAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = optionalText(formData.get("id"));

  if (!can(user.role, id ? "edit" : "create", "project")) {
    return { error: `Your role cannot ${id ? "edit" : "create"} projects.` };
  }

  const startDate = fromDateInputValue(formData.get("startDate"));
  const dueDate = fromDateInputValue(formData.get("dueDate"));

  if (startDate === undefined || dueDate === undefined) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: {
        ...(startDate === undefined ? { startDate: "That is not a valid date." } : {}),
        ...(dueDate === undefined ? { dueDate: "That is not a valid date." } : {}),
      },
    };
  }

  const parsed = projectSchema.safeParse({
    name: text(formData.get("name")),
    description: optionalText(formData.get("description")),
    status: text(formData.get("status")),
    startDate,
    dueDate,
    leadId: text(formData.get("leadId")),
    relationshipId: optionalText(formData.get("relationshipId")),
  });

  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const tagConnections = await connectTags(tagLabels(formData.get("tags")));
  const data = { ...parsed.data, tags: { set: [], connect: tagConnections } };

  const AUDITED = ["name", "description", "status", "startDate", "dueDate", "leadId", "relationshipId"] as const;

  let saved;
  if (id) {
    const before = await prisma.project.findUnique({ where: { id } });
    saved = await prisma.project.update({ where: { id }, data });
    if (before) {
      const { changed, metadata } = diffFields(before, saved, AUDITED);
      if (changed.length > 0) {
        await recordAudit({
          actor: user, action: "UPDATE", resource: "project",
          resourceId: saved.id, resourceLabel: saved.name,
          summary: `Changed ${listFields(changed)} on ${saved.name}`,
          metadata,
        });
      }
    }
  } else {
    saved = await prisma.project.create({ data });
    await recordAudit({
      actor: user, action: "CREATE", resource: "project",
      resourceId: saved.id, resourceLabel: saved.name,
      summary: `Started project ${saved.name}`,
    });
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${saved.id}`);
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "delete", "project")) return;

  const id = text(formData.get("id"));
  const deleted = await prisma.project.delete({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });

  await recordAudit({
    actor: user, action: "DELETE", resource: "project",
    resourceId: id, resourceLabel: deleted.name,
    summary: `Permanently deleted project ${deleted.name}, with ${deleted._count.tasks} tasks`,
    metadata: { status: deleted.status, tasks: deleted._count.tasks },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}

// ═══════════════════════════════════════════════════════════════════
//  Tasks
// ═══════════════════════════════════════════════════════════════════

export async function saveTaskAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = optionalText(formData.get("id"));

  if (!can(user.role, id ? "edit" : "create", "task")) {
    return { error: `Your role cannot ${id ? "edit" : "create"} tasks.` };
  }

  const dueDate = fromDateInputValue(formData.get("dueDate"));
  if (dueDate === undefined) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { dueDate: "That is not a valid date." },
    };
  }

  const parsed = taskSchema.safeParse({
    projectId: text(formData.get("projectId")),
    title: text(formData.get("title")),
    description: optionalText(formData.get("description")),
    status: text(formData.get("status")),
    priority: text(formData.get("priority")),
    dueDate,
    assigneeId: optionalText(formData.get("assigneeId")),
  });

  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const completedAt = parsed.data.status === "DONE" ? new Date() : null;

  if (id) {
    await prisma.task.update({ where: { id }, data: { ...parsed.data, completedAt } });
  } else {
    // New tasks go to the end of their column.
    const last = await prisma.task.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    await prisma.task.create({
      data: { ...parsed.data, completedAt, order: (last?.order ?? -1) + 1 },
    });
  }

  revalidatePath(`/projects/${parsed.data.projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { ok: true };
}

/**
 * Move a task to another status from the board, without opening a form. The
 * completion timestamp is set or cleared here so it can never disagree with the
 * status it is meant to record.
 */
export async function setTaskStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "edit", "task")) return;

  const id = text(formData.get("id"));
  const status = taskStatusSchema.safeParse(text(formData.get("status")));
  if (!status.success) return;

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: status.data,
      completedAt: status.data === "DONE" ? new Date() : null,
    },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "delete", "task")) return;

  const task = await prisma.task.delete({
    where: { id: text(formData.get("id")) },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/dashboard");
}

// ═══════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════

async function connectTags(labels: string[]): Promise<{ id: string }[]> {
  const connections: { id: string }[] = [];
  for (const label of labels) {
    const tag = await prisma.tag.upsert({
      where: { label },
      create: { label },
      update: {},
      select: { id: true },
    });
    connections.push({ id: tag.id });
  }
  return connections;
}
