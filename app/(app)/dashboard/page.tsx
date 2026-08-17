import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, History, ListTodo } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard/queries";
import { describeLastContact } from "@/lib/brm/cadence";
import { progressPercent } from "@/lib/pm/project-health";
import { formatDateCompact, formatDays, formatRelativeDate } from "@/lib/format";

import { Metric, MetricStrip } from "@/components/ui/metric";
import { Row, Rows, Section } from "@/components/ui/section";
import { BarList, ProgressBar } from "@/components/ui/bar-list";
import { EmptyState } from "@/components/ui/empty-state";
import {
  InteractionChannelBadge,
  RelationshipTypeBadge,
  TaskPriorityBadge,
} from "@/components/domain/badges";

export const metadata: Metadata = { title: "Dashboard" };

/** Rail colour by urgency — the reserved status tokens, nothing invented. */
const RAIL = {
  overdue: "var(--status-critical)",
  dueSoon: "var(--status-warning)",
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const data = await getDashboardData(now);

  const firstName = user.name.split(" ")[0];
  const { OVERDUE, DUE_SOON } = data.cadenceSummary;
  const atRisk = data.projectSummary.atRisk;
  const needsNothing = OVERDUE === 0 && DUE_SOON === 0 && atRisk === 0;

  return (
    <div className="space-y-9">
      {/* ══ The answer ═══════════════════════════════════════════
          One statement, at the top, at a size nothing else on the page
          competes with. A reader should be able to stand two metres from
          the screen and know whether today needs them. */}
      <header>
        <p className="eyebrow">
          {new Intl.DateTimeFormat("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(now)}
          {" · "}
          {firstName}
        </p>

        {needsNothing ? (
          <>
            <h1 className="mt-2 max-w-2xl text-display text-ink">
              Everything is on track.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-secondary">
              No relationship has lapsed past its cadence and no project is
              overdue or blocked.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-2 max-w-3xl text-display text-ink">
              {/* The figure wears the mono face while the sentence stays in
                  the sans — the number is the datum, the rest is prose. */}
              {OVERDUE > 0 ? (
                <>
                  <span className="tabular text-critical">{OVERDUE}</span>{" "}
                  <span className="text-critical">
                    relationship{OVERDUE === 1 ? "" : "s"}
                  </span>{" "}
                  need{OVERDUE === 1 ? "s" : ""} contact
                </>
              ) : (
                <>
                  <span className="tabular">{DUE_SOON}</span> relationship
                  {DUE_SOON === 1 ? "" : "s"} fall{DUE_SOON === 1 ? "s" : ""}{" "}
                  due shortly
                </>
              )}
              <span className="text-ink-muted">.</span>
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm text-ink-secondary">
              {DUE_SOON > 0 && OVERDUE > 0 ? (
                <>
                  Another {DUE_SOON}{" "}
                  {DUE_SOON === 1
                    ? "is inside the final fifth of its window"
                    : "are inside the final fifth of their windows"}
                  {atRisk > 0 ? ", and " : ". "}
                </>
              ) : null}
              {atRisk > 0 ? (
                <>
                  {DUE_SOON > 0 && OVERDUE > 0 ? "" : "Meanwhile, "}
                  {atRisk} project{atRisk === 1 ? " is" : "s are"} at risk —
                  overdue, or held up by a blocked task.
                </>
              ) : (
                "No project is at risk."
              )}
            </p>
          </>
        )}
      </header>

      {/* ══ Supporting figures ══════════════════════════════════ */}
      <MetricStrip>
        <Metric
          label="Overdue"
          value={OVERDUE}
          tone={OVERDUE > 0 ? "critical" : "good"}
          note="Past agreed cadence"
          href="/relationships?cadence=OVERDUE"
        />
        <Metric
          label="Due soon"
          value={DUE_SOON}
          tone={DUE_SOON > 0 ? "warning" : "good"}
          note="Within the warning window"
          href="/relationships?cadence=DUE_SOON"
        />
        <Metric
          label="At risk"
          value={atRisk}
          tone={atRisk > 0 ? "critical" : "good"}
          note="Overdue or blocked"
          href="/projects?risk=at-risk"
        />
        <Metric
          label="In flight"
          value={data.projectSummary.live}
          note={`${data.totals.relationships} relationships tracked`}
          href="/projects"
        />
      </MetricStrip>

      {/* ══ What to do about it ═════════════════════════════════ */}
      <div className="grid gap-7 lg:grid-cols-[1.65fr_1fr]">
        <Section
          title="Needs contact"
          description="Overdue first, then those about to lapse."
          action={{ href: "/relationships", label: "All relationships" }}
        >
          {data.needsAttention.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CheckCircle2}
                title="Every relationship is on track"
                description="Nothing has lapsed past its agreed cadence."
              />
            </div>
          ) : (
            <Rows>
              {data.needsAttention.slice(0, 7).map((row) => (
                <Row
                  key={row.id}
                  href={`/relationships/${row.id}`}
                  rail={
                    row.cadence.status === "OVERDUE" ? RAIL.overdue : RAIL.dueSoon
                  }
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink">
                      {row.name}
                    </p>
                    <span
                      className={
                        row.cadence.status === "OVERDUE"
                          ? "tabular shrink-0 text-xs font-semibold text-critical"
                          : "tabular shrink-0 text-xs font-medium text-ink-secondary"
                      }
                    >
                      {row.cadence.status === "OVERDUE"
                        ? `${formatDays(row.cadence.daysOverdue ?? 0)} over`
                        : `${formatDays(row.cadence.daysUntilDue ?? 0)} left`}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <RelationshipTypeBadge type={row.type} />
                    <span className="truncate text-xs text-ink-muted">
                      {describeLastContact(row.cadence)} · {row.ownerName}
                    </span>
                  </div>
                </Row>
              ))}
            </Rows>
          )}
        </Section>

        <Section title="By type" description="Archived excluded." bordered={false}>
          <div className="rounded-xl border border-hairline bg-surface px-4 py-4">
            <BarList items={data.relationshipsByType} />
          </div>
        </Section>
      </div>

      <div className="grid gap-7 lg:grid-cols-[1.65fr_1fr]">
        <Section
          title="Projects at risk"
          description="Soonest due first."
          action={{ href: "/projects", label: "All projects" }}
        >
          {data.atRiskProjects.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CheckCircle2}
                title="No project is at risk"
                description="Nothing is overdue and nothing is blocked."
              />
            </div>
          ) : (
            <Rows>
              {data.atRiskProjects.map((row) => (
                <Row key={row.id} href={`/projects/${row.id}`} rail={RAIL.overdue}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink">
                      {row.name}
                    </p>
                    <span className="shrink-0 text-xs font-medium text-critical">
                      {row.health.riskReasons[0]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-muted">
                    {row.leadName}
                    {row.relationshipName ? ` · for ${row.relationshipName}` : ""}
                  </p>
                  <div className="mt-2 flex items-center gap-2.5">
                    <ProgressBar
                      percent={progressPercent(row.health)}
                      className="max-w-44"
                    />
                    <span className="tabular text-xs text-ink-muted">
                      {row.health.taskCounts.DONE}/{row.health.taskCounts.total}
                    </span>
                  </div>
                </Row>
              ))}
            </Rows>
          )}
        </Section>

        <Section title="By status" bordered={false}>
          <div className="rounded-xl border border-hairline bg-surface px-4 py-4">
            <BarList items={data.projectsByStatus} />
          </div>
        </Section>
      </div>

      <div className="grid gap-7 lg:grid-cols-2">
        <Section title="Next due" description="Open tasks on live projects.">
          {data.upcomingTasks.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={ListTodo} title="Nothing scheduled" />
            </div>
          ) : (
            <Rows>
              {data.upcomingTasks.map((task) => {
                const overdue = task.dueDate < now;
                return (
                  <Row
                    key={task.id}
                    href={`/projects/${task.projectId}`}
                    rail={overdue ? RAIL.overdue : undefined}
                    className="py-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-ink">{task.title}</p>
                      <span
                        className={
                          overdue
                            ? "tabular shrink-0 text-xs font-semibold text-critical"
                            : "tabular shrink-0 text-xs text-ink-muted"
                        }
                      >
                        {formatRelativeDate(task.dueDate, now)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <TaskPriorityBadge priority={task.priority} />
                      <span className="truncate text-xs text-ink-muted">
                        {task.projectName}
                        {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                      </span>
                    </div>
                  </Row>
                );
              })}
            </Rows>
          )}
        </Section>

        <Section title="Recent contact" description="The latest touchpoints logged.">
          {data.recentInteractions.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={History} title="No interactions logged yet" />
            </div>
          ) : (
            <Rows>
              {data.recentInteractions.map((interaction) => (
                <Row
                  key={interaction.id}
                  href={`/relationships/${interaction.relationshipId}`}
                  className="py-2.5"
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
                    <InteractionChannelBadge channel={interaction.channel} />
                    {interaction.projectName ? (
                      <span className="truncate text-xs text-ink-muted">
                        {interaction.projectName}
                      </span>
                    ) : null}
                  </div>
                </Row>
              ))}
            </Rows>
          )}
        </Section>
      </div>

      <p className="border-t border-line pt-4 text-xs text-ink-muted">
        Synthetic data, seeded for demonstration. Nothing here is connected to a
        live system.{" "}
        <Link href="/relationships" className="text-accent hover:underline">
          Browse relationships
        </Link>
      </p>
    </div>
  );
}
