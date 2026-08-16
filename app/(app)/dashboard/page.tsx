import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Handshake,
  History,
  ListTodo,
} from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard/queries";
import { describeLastContact } from "@/lib/brm/cadence";
import { progressPercent } from "@/lib/pm/project-health";
import { formatDateCompact, formatDays, formatRelativeDate } from "@/lib/format";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { BarList, ProgressBar } from "@/components/ui/bar-list";
import { EmptyState, PageHeader } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import {
  CadenceBadge,
  InteractionChannelBadge,
  RelationshipTypeBadge,
  RiskBadge,
  TaskPriorityBadge,
} from "@/components/domain/badges";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const data = await getDashboardData(now);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day, ${firstName}`}
        description="Relationship health beside project status — the single operational picture."
      />

      {/* ── The four headline numbers ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Relationships overdue"
          value={data.cadenceSummary.OVERDUE}
          status={data.cadenceSummary.OVERDUE > 0 ? "critical" : "good"}
          hint="Past the contact rhythm the team agreed"
          href="/relationships?cadence=OVERDUE"
        />
        <StatTile
          label="Due soon"
          value={data.cadenceSummary.DUE_SOON}
          status={data.cadenceSummary.DUE_SOON > 0 ? "warning" : "good"}
          hint="Inside the final fifth of the cadence window"
          href="/relationships?cadence=DUE_SOON"
        />
        <StatTile
          label="Projects at risk"
          value={data.projectSummary.atRisk}
          status={data.projectSummary.atRisk > 0 ? "critical" : "good"}
          hint="Overdue, or held up by a blocked task"
          href="/projects?risk=at-risk"
        />
        <StatTile
          label="Projects in flight"
          value={data.projectSummary.live}
          hint={`${data.totals.relationships} active relationships tracked`}
          href="/projects"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Relationships needing attention ──────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Relationships needing attention"
            description="Overdue first, then those about to lapse."
            action={
              <ButtonLink href="/relationships" size="sm">
                All relationships
              </ButtonLink>
            }
          />
          <CardBody className="p-0">
            {data.needsAttention.length === 0 ? (
              <div className="px-5 py-4">
                <EmptyState
                  icon={CheckCircle2}
                  title="Every relationship is on track"
                  description="Nothing has lapsed past its agreed cadence."
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {data.needsAttention.slice(0, 7).map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/relationships/${row.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-sunken"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {row.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {describeLastContact(row.cadence)} · owned by{" "}
                          {row.ownerName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <RelationshipTypeBadge type={row.type} />
                        <CadenceBadge
                          status={row.cadence.status}
                          detail={
                            row.cadence.status === "OVERDUE"
                              ? `${formatDays(row.cadence.daysOverdue ?? 0)} over`
                              : `${formatDays(row.cadence.daysUntilDue ?? 0)} left`
                          }
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ── Relationship mix ─────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Relationships by type"
            description="Archived relationships excluded."
          />
          <CardBody>
            <BarList items={data.relationshipsByType} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Projects at risk ─────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Projects at risk"
            description="Overdue or blocked, soonest due first."
            action={
              <ButtonLink href="/projects" size="sm">
                All projects
              </ButtonLink>
            }
          />
          <CardBody className="p-0">
            {data.atRiskProjects.length === 0 ? (
              <div className="px-5 py-4">
                <EmptyState
                  icon={CheckCircle2}
                  title="No project is at risk"
                  description="Nothing is overdue and nothing is blocked."
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {data.atRiskProjects.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/projects/${row.id}`}
                      className="block px-5 py-3 hover:bg-sunken"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {row.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-ink-muted">
                            Led by {row.leadName}
                            {row.relationshipName
                              ? ` · for ${row.relationshipName}`
                              : ""}
                          </p>
                        </div>
                        <RiskBadge reasons={row.health.riskReasons} />
                      </div>
                      <div className="mt-2.5 flex items-center gap-3">
                        <ProgressBar
                          percent={progressPercent(row.health)}
                          className="max-w-48"
                        />
                        <span className="tabular text-xs text-ink-muted">
                          {row.health.taskCounts.DONE} of{" "}
                          {row.health.taskCounts.total} tasks
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ── Project mix ──────────────────────────────────────── */}
        <Card>
          <CardHeader title="Projects by status" />
          <CardBody>
            <BarList items={data.projectsByStatus} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Upcoming tasks ───────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Next due"
            description="Open tasks on live projects."
          />
          <CardBody className="p-0">
            {data.upcomingTasks.length === 0 ? (
              <div className="px-5 py-4">
                <EmptyState icon={ListTodo} title="Nothing scheduled" />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {data.upcomingTasks.map((task) => {
                  const overdue = task.dueDate < now;
                  return (
                    <li key={task.id}>
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-sunken"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-ink">
                            {task.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-ink-muted">
                            {task.projectName}
                            {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <TaskPriorityBadge priority={task.priority} />
                          <span
                            className={
                              overdue
                                ? "tabular text-xs font-medium text-critical"
                                : "tabular text-xs text-ink-muted"
                            }
                          >
                            {formatRelativeDate(task.dueDate, now)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ── Recent interactions ──────────────────────────────── */}
        <Card>
          <CardHeader
            title="Recent contact"
            description="The latest touchpoints logged against relationships."
          />
          <CardBody className="p-0">
            {data.recentInteractions.length === 0 ? (
              <div className="px-5 py-4">
                <EmptyState icon={History} title="No interactions logged yet" />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {data.recentInteractions.map((interaction) => (
                  <li key={interaction.id}>
                    <Link
                      href={`/relationships/${interaction.relationshipId}`}
                      className="block px-5 py-2.5 hover:bg-sunken"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-ink">
                          {interaction.relationshipName}
                        </p>
                        <span className="tabular shrink-0 text-xs text-ink-muted">
                          {formatDateCompact(interaction.occurredAt, now)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-secondary">
                        {interaction.summary}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <InteractionChannelBadge
                          channel={interaction.channel}
                        />
                        {interaction.projectName ? (
                          <span className="truncate text-xs text-ink-muted">
                            <CalendarClock
                              className="mr-1 inline size-3"
                              aria-hidden="true"
                            />
                            {interaction.projectName}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Handshake className="size-3.5" aria-hidden="true" />
        All figures derive from synthetic data seeded for demonstration.
      </p>
    </div>
  );
}
