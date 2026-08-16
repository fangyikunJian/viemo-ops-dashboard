import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Handshake,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getProject, getProjectFormOptions } from "@/lib/pm/queries";
import { progressPercent } from "@/lib/pm/project-health";
import {
  deleteProjectAction,
  deleteTaskAction,
  setTaskStatusAction,
} from "@/lib/pm/actions";
import { formatDate, formatRelativeDate } from "@/lib/format";
import {
  TASK_STATUSES,
  TASK_STATUS_TERMS,
  type TaskStatus,
} from "@/lib/domain/enums";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/bar-list";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  InteractionChannelBadge,
  ProjectStatusBadge,
  RelationshipTypeBadge,
  RiskBadge,
  TaskPriorityBadge,
} from "@/components/domain/badges";
import { AddTaskForm } from "@/components/pm/add-task-form";

export async function generateMetadata({
  params,
}: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const now = new Date();
  const [project, options] = await Promise.all([
    getProject(id, now),
    getProjectFormOptions(),
  ]);

  if (!project) notFound();

  const canEdit = can(user.role, "edit", "project");
  const canDelete = can(user.role, "delete", "project");
  const canEditTask = can(user.role, "edit", "task");
  const canCreateTask = can(user.role, "create", "task");
  const canDeleteTask = can(user.role, "delete", "task");

  const { health } = project;

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All projects
      </Link>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {project.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <RiskBadge reasons={health.riskReasons} />
            {project.tags.map((tag) => (
              <Badge key={tag.id} tone="slate">
                {tag.label}
              </Badge>
            ))}
          </div>
          {project.description ? (
            <p className="mt-3 max-w-2xl text-sm text-ink-secondary">
              {project.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canEdit ? (
            <ButtonLink href={`/projects/${project.id}/edit`} size="sm">
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </ButtonLink>
          ) : null}
          {canDelete ? (
            <form action={deleteProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <Button type="submit" size="sm" variant="danger">
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {/* ── Summary strip ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Progress">
          <div className="flex items-center gap-2">
            <ProgressBar percent={progressPercent(health)} />
            <span className="tabular shrink-0 text-sm font-medium text-ink">
              {progressPercent(health)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {health.taskCounts.DONE} of {health.taskCounts.total} tasks done
          </p>
        </Fact>

        <Fact label="Due">
          <p
            className={
              health.isOverdue
                ? "text-sm font-medium text-critical"
                : "text-sm text-ink"
            }
          >
            {project.dueDate ? formatDate(project.dueDate) : "No date set"}
          </p>
          {project.dueDate ? (
            <p className="mt-1 text-xs text-ink-muted">
              {formatRelativeDate(project.dueDate, now)}
            </p>
          ) : null}
        </Fact>

        <Fact label="Lead">
          <p className="text-sm text-ink">{project.lead.name}</p>
          {project.startDate ? (
            <p className="mt-1 text-xs text-ink-muted">
              Started {formatDate(project.startDate)}
            </p>
          ) : null}
        </Fact>

        <Fact label="For">
          {project.relationship ? (
            <>
              <Link
                href={`/relationships/${project.relationship.id}`}
                className="flex items-center gap-1 text-sm text-accent hover:underline"
              >
                <Handshake className="size-3.5" aria-hidden="true" />
                {project.relationship.name}
                <ChevronRight className="size-3" aria-hidden="true" />
              </Link>
              <div className="mt-1.5">
                <RelationshipTypeBadge type={project.relationship.type} />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Internal work</p>
          )}
        </Fact>
      </div>

      {/* ── Task board ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Tasks</h2>
          {canCreateTask ? (
            <AddTaskForm
              projectId={project.id}
              teamMembers={options.teamMembers}
            />
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {TASK_STATUSES.map((status) => {
            const tasks = project.tasks.filter((task) => task.status === status);
            return (
              <section
                key={status}
                className="rounded-xl border border-hairline bg-surface"
              >
                <header className="flex items-center justify-between border-b border-line px-3 py-2.5">
                  <h3 className="text-xs font-semibold text-ink">
                    {TASK_STATUS_TERMS[status].label}
                  </h3>
                  <span className="tabular rounded-full bg-sunken px-1.5 text-[10px] text-ink-muted">
                    {tasks.length}
                  </span>
                </header>

                <ul className="space-y-2 p-2">
                  {tasks.length === 0 ? (
                    <li className="px-1 py-3 text-center text-xs text-ink-muted">
                      Nothing here
                    </li>
                  ) : (
                    tasks.map((task) => {
                      const overdue =
                        task.dueDate !== null &&
                        task.status !== "DONE" &&
                        task.dueDate < now;

                      return (
                        <li
                          key={task.id}
                          className="rounded-lg border border-hairline bg-plane p-2.5"
                        >
                          <p className="text-xs font-medium text-ink">
                            {task.title}
                          </p>
                          {task.description ? (
                            <p className="mt-1 line-clamp-2 text-[11px] text-ink-secondary">
                              {task.description}
                            </p>
                          ) : null}

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <TaskPriorityBadge priority={task.priority} />
                            {task.dueDate ? (
                              <span
                                className={
                                  overdue
                                    ? "tabular text-[11px] font-medium text-critical"
                                    : "tabular text-[11px] text-ink-muted"
                                }
                              >
                                {formatRelativeDate(task.dueDate, now)}
                              </span>
                            ) : null}
                          </div>

                          {task.assignee ? (
                            <p className="mt-1.5 truncate text-[11px] text-ink-muted">
                              {task.assignee.name}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-[11px] text-ink-muted italic">
                              Unassigned
                            </p>
                          )}

                          {canEditTask || canDeleteTask ? (
                            <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-line pt-2">
                              {canEditTask
                                ? TASK_STATUSES.filter(
                                    (target) => target !== status,
                                  ).map((target) => (
                                    <MoveButton
                                      key={target}
                                      taskId={task.id}
                                      target={target}
                                    />
                                  ))
                                : null}
                              {canDeleteTask ? (
                                <form action={deleteTaskAction}>
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={task.id}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded p-0.5 text-ink-muted hover:text-critical"
                                    aria-label={`Delete ${task.title}`}
                                  >
                                    <Trash2
                                      className="size-3"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {/* ── Interactions about this project — the seam back ───── */}
      {project.interactions.length > 0 ? (
        <Card>
          <CardHeader
            title="Conversations about this project"
            description="Interactions logged against a relationship and tagged to this project."
          />
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {project.interactions.map((interaction) => (
                <li key={interaction.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/relationships/${interaction.relationship.id}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      <MessageSquare
                        className="mr-1.5 inline size-3.5"
                        aria-hidden="true"
                      />
                      {interaction.relationship.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <InteractionChannelBadge channel={interaction.channel} />
                      <span className="tabular text-xs text-ink-muted">
                        {formatDate(interaction.occurredAt)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {interaction.summary}
                  </p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface px-4 py-3">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function MoveButton({
  taskId,
  target,
}: {
  taskId: string;
  target: TaskStatus;
}) {
  return (
    <form action={setTaskStatusAction}>
      <input type="hidden" name="id" value={taskId} />
      <input type="hidden" name="status" value={target} />
      <button
        type="submit"
        className="rounded border border-hairline px-1.5 py-0.5 text-[10px] text-ink-secondary hover:bg-sunken hover:text-ink"
        title={`Move to ${TASK_STATUS_TERMS[target].label}`}
      >
        {TASK_STATUS_TERMS[target].label}
      </button>
    </form>
  );
}
