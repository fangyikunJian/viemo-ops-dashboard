import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus, Search } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { countProjects, listProjects } from "@/lib/pm/queries";
import { progressPercent } from "@/lib/pm/project-health";
import { formatDate, formatRelativeDate } from "@/lib/format";
import { PROJECT_STATUSES, PROJECT_STATUS_TERMS } from "@/lib/domain/enums";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/bar-list";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import { FilterChip } from "@/components/ui/filter-chip";
import { ProjectStatusBadge, RiskBadge } from "@/components/domain/badges";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: PageProps<"/projects">) {
  const user = await requireUser();
  const params = await searchParams;

  const filters = {
    status: single(params.status),
    risk: single(params.risk),
    q: single(params.q),
  };

  const now = new Date();
  const [rows, counts] = await Promise.all([
    listProjects(filters, now),
    countProjects(now),
  ]);

  const canCreate = can(user.role, "create", "project");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Project work with owners, statuses and deadlines. Projects are the organising unit; tasks belong to them."
        action={
          canCreate ? (
            <ButtonLink href="/projects/new" variant="primary">
              <Plus className="size-4" aria-hidden="true" />
              New project
            </ButtonLink>
          ) : null
        }
      />

      <div className="space-y-3">
        <form method="get" className="flex max-w-md items-center gap-2">
          {filters.status ? (
            <input type="hidden" name="status" value={filters.status} />
          ) : null}
          {filters.risk ? (
            <input type="hidden" name="risk" value={filters.risk} />
          ) : null}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search by name"
              aria-label="Search projects by name"
              className="pl-8"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-lg border border-hairline bg-surface px-3 text-sm text-ink hover:bg-sunken"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-16 shrink-0 text-xs font-medium text-ink-muted">
            Attention
          </span>
          <FilterChip
            label="At risk"
            count={counts.atRisk}
            active={filters.risk === "at-risk"}
            href={hrefWith(params, "risk", "at-risk")}
          />
          <FilterChip
            label="In flight"
            count={counts.live}
            active={filters.risk === "live"}
            href={hrefWith(params, "risk", "live")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-16 shrink-0 text-xs font-medium text-ink-muted">
            Status
          </span>
          {PROJECT_STATUSES.map((status) => (
            <FilterChip
              key={status}
              label={PROJECT_STATUS_TERMS[status].label}
              active={filters.status === status}
              href={hrefWith(params, "status", status)}
            />
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <div className="p-5">
            <EmptyState
              icon={FolderKanban}
              title="No projects match"
              description="Try clearing a filter, or start the project if it is not here yet."
              action={
                canCreate ? (
                  <ButtonLink href="/projects/new" variant="primary" size="sm">
                    <Plus className="size-4" aria-hidden="true" />
                    New project
                  </ButtonLink>
                ) : null
              }
            />
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/projects/${row.id}`}
              className="flex flex-col rounded-xl border border-hairline bg-surface p-4 shadow-[0_1px_2px_rgba(11,11,11,0.04)] hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-medium text-ink">{row.name}</h2>
                <ProjectStatusBadge status={row.status} />
              </div>

              {row.description ? (
                <p className="mt-1.5 line-clamp-2 text-xs text-ink-secondary">
                  {row.description}
                </p>
              ) : null}

              <div className="mt-3 flex items-center gap-2">
                <ProgressBar percent={progressPercent(row.health)} />
                <span className="tabular shrink-0 text-xs text-ink-muted">
                  {row.health.taskCounts.DONE}/{row.health.taskCounts.total}
                </span>
              </div>

              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Lead</dt>
                  <dd className="truncate text-ink-secondary">{row.leadName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Due</dt>
                  <dd
                    className={
                      row.health.isOverdue
                        ? "font-medium text-critical"
                        : "text-ink-secondary"
                    }
                  >
                    {row.dueDate
                      ? `${formatDate(row.dueDate)} · ${formatRelativeDate(row.dueDate, now)}`
                      : "No date"}
                  </dd>
                </div>
                {row.relationshipName ? (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">For</dt>
                    <dd className="truncate text-ink-secondary">
                      {row.relationshipName}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <RiskBadge reasons={row.health.riskReasons} />
                {row.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag.id} tone="slate">
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-muted">
        {rows.length} project{rows.length === 1 ? "" : "s"} shown, soonest due
        first.
      </p>
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

function hrefWith(
  params: Record<string, string | string[] | undefined>,
  key: string,
  value: string,
): string {
  const next = new URLSearchParams();

  for (const [existingKey, existingValue] of Object.entries(params)) {
    const flat = Array.isArray(existingValue) ? existingValue[0] : existingValue;
    if (flat && existingKey !== key) next.set(existingKey, flat);
  }

  const current = params[key];
  const flatCurrent = Array.isArray(current) ? current[0] : current;
  if (flatCurrent !== value) next.set(key, value);

  const query = next.toString();
  return query ? `/projects?${query}` : "/projects";
}
