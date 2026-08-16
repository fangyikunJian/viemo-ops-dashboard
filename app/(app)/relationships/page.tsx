import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Plus, Search, X } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { countByCadence, listRelationships } from "@/lib/brm/queries";
import { describeLastContact } from "@/lib/brm/cadence";
import { formatDays } from "@/lib/format";
import {
  CADENCE_STATUSES,
  CADENCE_STATUS_TERMS,
  RELATIONSHIP_STATUSES,
  RELATIONSHIP_STATUS_TERMS,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_TYPE_TERMS,
  type CadenceStatus,
} from "@/lib/domain/enums";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  RelationshipStatusBadge,
  RelationshipTypeBadge,
} from "@/components/domain/badges";

export const metadata: Metadata = { title: "Relationships" };

const RAIL: Partial<Record<CadenceStatus, string>> = {
  OVERDUE: "var(--status-critical)",
  DUE_SOON: "var(--status-warning)",
};

export default async function RelationshipsPage({
  searchParams,
}: PageProps<"/relationships">) {
  const user = await requireUser();
  const params = await searchParams;

  const filters = {
    type: single(params.type),
    status: single(params.status),
    cadence: single(params.cadence),
    q: single(params.q),
  };

  const now = new Date();
  const [rows, cadenceCounts] = await Promise.all([
    listRelationships(filters, now),
    countByCadence(now),
  ]);

  const canCreate = can(user.role, "create", "relationship");
  const activeFilters = [filters.type, filters.status, filters.cadence, filters.q]
    .filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Business Relationship Management</p>
          <h1 className="mt-1.5 text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
            Relationships
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-secondary">
            Everyone the studio&rsquo;s success depends on — not only the people
            who pay it. Each maintained to its own agreed rhythm.
          </p>
        </div>
        {canCreate ? (
          <ButtonLink href="/relationships/new" variant="primary">
            <Plus className="size-4" aria-hidden="true" />
            New relationship
          </ButtonLink>
        ) : null}
      </header>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-hairline bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
          <form method="get" className="relative min-w-56 flex-1">
            {(["type", "status", "cadence"] as const).map((key) =>
              filters[key] ? (
                <input key={key} type="hidden" name={key} value={filters[key]} />
              ) : null,
            )}
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search by name…"
              aria-label="Search relationships by name"
              className="h-8 border-0 bg-sunken pl-8 text-[0.8125rem]"
            />
          </form>

          <div className="flex items-center gap-1.5">
            {CADENCE_STATUSES.map((status) => (
              <FilterChip
                key={status}
                label={CADENCE_STATUS_TERMS[status].label}
                count={cadenceCounts[status]}
                active={filters.cadence === status}
                href={hrefWith(params, "cadence", status)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
          <FilterGroup label="Type">
            {RELATIONSHIP_TYPES.map((type) => (
              <FilterChip
                key={type}
                label={RELATIONSHIP_TYPE_TERMS[type].label}
                active={filters.type === type}
                href={hrefWith(params, "type", type)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Status">
            {RELATIONSHIP_STATUSES.map((status) => (
              <FilterChip
                key={status}
                label={RELATIONSHIP_STATUS_TERMS[status].label}
                active={filters.status === status}
                href={hrefWith(params, "status", status)}
              />
            ))}
          </FilterGroup>

          {activeFilters > 0 ? (
            <Link
              href="/relationships"
              className="ml-auto flex items-center gap-1 text-xs font-medium text-ink-secondary hover:text-critical"
            >
              <X className="size-3" aria-hidden="true" />
              Clear {activeFilters}
            </Link>
          ) : null}
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-surface p-5">
          <EmptyState
            icon={Handshake}
            title="No relationships match"
            description="Try clearing a filter, or add the relationship if it is not here yet."
            action={
              canCreate ? (
                <ButtonLink href="/relationships/new" variant="primary" size="sm">
                  <Plus className="size-4" aria-hidden="true" />
                  New relationship
                </ButtonLink>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
          {/* Column headings, so the columns below read as columns. */}
          <div className="hidden items-center gap-4 border-b border-line bg-sunken/50 px-4 py-2 md:flex">
            <span className="eyebrow flex-1">Relationship</span>
            <span className="eyebrow w-40 shrink-0">Owner</span>
            <span className="eyebrow w-44 shrink-0">Last contact</span>
            <span className="eyebrow w-24 shrink-0 text-right">Cadence</span>
          </div>

          <div className="divide-y divide-line">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/relationships/${row.id}`}
                className="rail flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-sunken/70 md:flex-row md:items-center md:gap-4"
                style={
                  {
                    "--rail-colour": RAIL[row.cadence.status] ?? "transparent",
                  } as React.CSSProperties
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-medium text-ink">
                      {row.name}
                    </span>
                    <RelationshipTypeBadge type={row.type} />
                    {row.status !== "ACTIVE" ? (
                      <RelationshipStatusBadge status={row.status} />
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {row.organisationName ? `${row.organisationName} · ` : ""}
                    {row.interactionCount} interaction
                    {row.interactionCount === 1 ? "" : "s"}
                    {row.projectCount > 0
                      ? ` · ${row.projectCount} project${row.projectCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>

                <span className="w-40 shrink-0 truncate text-xs text-ink-secondary max-md:hidden">
                  {row.ownerName}
                </span>

                <span className="w-44 shrink-0 truncate text-xs text-ink-secondary max-md:hidden">
                  {describeLastContact(row.cadence).replace("Contacted ", "")}
                </span>

                <span className="w-24 shrink-0 text-right max-md:text-left">
                  <CadenceCell
                    status={row.cadence.status}
                    daysOverdue={row.cadence.daysOverdue}
                    daysUntilDue={row.cadence.daysUntilDue}
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-muted">
        {rows.length} of {cadenceCounts.OVERDUE + cadenceCounts.DUE_SOON + cadenceCounts.ON_TRACK + cadenceCounts.NOT_TRACKED}{" "}
        relationships. Sorted by how urgently each needs contact, then by name.
      </p>
    </div>
  );
}

/**
 * The cadence column.
 *
 * A number and a word, not a badge — at forty rows a badge on every line turns
 * the column into a wall of pills and the urgent ones stop standing out. The
 * rail down the row's left edge already carries the colour.
 */
function CadenceCell({
  status,
  daysOverdue,
  daysUntilDue,
}: {
  status: CadenceStatus;
  daysOverdue: number | null;
  daysUntilDue: number | null;
}) {
  if (status === "OVERDUE") {
    return (
      <span className="tabular text-xs font-semibold text-critical">
        {formatDays(daysOverdue ?? 0)} over
      </span>
    );
  }
  if (status === "DUE_SOON") {
    return (
      <span className="tabular text-xs font-medium text-ink">
        {formatDays(daysUntilDue ?? 0)} left
      </span>
    );
  }
  if (status === "ON_TRACK") {
    return <span className="text-xs text-ink-muted">On track</span>;
  }
  return <span className="text-xs text-ink-muted">Not tracked</span>;
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="eyebrow mr-0.5">{label}</span>
      {children}
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

/**
 * Build the URL for a filter chip: selecting the value it already has clears
 * it, so a chip is a toggle rather than a one-way door.
 */
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
  return query ? `/relationships?${query}` : "/relationships";
}
