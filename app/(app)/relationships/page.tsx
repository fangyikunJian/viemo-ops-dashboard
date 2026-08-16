import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Plus, Search } from "lucide-react";

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

import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import {
  CadenceBadge,
  RelationshipStatusBadge,
  RelationshipTypeBadge,
} from "@/components/domain/badges";
import { FilterChip } from "@/components/ui/filter-chip";

export const metadata: Metadata = { title: "Relationships" };

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relationships"
        description="Every business relationship the studio maintains — advisors, investors, partners, institutions, suppliers and customers — with the rhythm each is meant to be kept at."
        action={
          canCreate ? (
            <ButtonLink href="/relationships/new" variant="primary">
              <Plus className="size-4" aria-hidden="true" />
              New relationship
            </ButtonLink>
          ) : null
        }
      />

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <form method="get" className="flex max-w-md items-center gap-2">
          {filters.type ? (
            <input type="hidden" name="type" value={filters.type} />
          ) : null}
          {filters.status ? (
            <input type="hidden" name="status" value={filters.status} />
          ) : null}
          {filters.cadence ? (
            <input type="hidden" name="cadence" value={filters.cadence} />
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
              aria-label="Search relationships by name"
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

        <FilterRow label="Cadence">
          {CADENCE_STATUSES.map((status) => (
            <FilterChip
              key={status}
              label={CADENCE_STATUS_TERMS[status].label}
              count={cadenceCounts[status as CadenceStatus]}
              active={filters.cadence === status}
              href={hrefWith(params, "cadence", status)}
            />
          ))}
        </FilterRow>

        <FilterRow label="Type">
          {RELATIONSHIP_TYPES.map((type) => (
            <FilterChip
              key={type}
              label={RELATIONSHIP_TYPE_TERMS[type].label}
              active={filters.type === type}
              href={hrefWith(params, "type", type)}
            />
          ))}
        </FilterRow>

        <FilterRow label="Status">
          {RELATIONSHIP_STATUSES.map((status) => (
            <FilterChip
              key={status}
              label={RELATIONSHIP_STATUS_TERMS[status].label}
              active={filters.status === status}
              href={hrefWith(params, "status", status)}
            />
          ))}
        </FilterRow>
      </div>

      {/* ── Results ────────────────────────────────────────────── */}
      <Card>
        {rows.length === 0 ? (
          <div className="p-5">
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
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/relationships/${row.id}`}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 py-3.5 hover:bg-sunken"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">
                        {row.name}
                      </p>
                      <RelationshipTypeBadge type={row.type} />
                      <RelationshipStatusBadge status={row.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-ink-muted">
                      {describeLastContact(row.cadence)}
                      {row.organisationName ? ` · ${row.organisationName}` : ""}
                      {` · owned by ${row.ownerName}`}
                      {` · ${row.interactionCount} interactions`}
                      {row.projectCount > 0
                        ? ` · ${row.projectCount} project${row.projectCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <CadenceBadge
                      status={row.cadence.status}
                      detail={cadenceDetail(row.cadence)}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-ink-muted">
        {rows.length} relationship{rows.length === 1 ? "" : "s"} shown. Sorted by
        how urgently each needs contact, then by name.
      </p>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-16 shrink-0 text-xs font-medium text-ink-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function cadenceDetail(cadence: {
  status: string;
  daysOverdue: number | null;
  daysUntilDue: number | null;
}): string | undefined {
  if (cadence.status === "OVERDUE") {
    return `${formatDays(cadence.daysOverdue ?? 0)} over`;
  }
  if (cadence.status === "DUE_SOON") {
    return `${formatDays(cadence.daysUntilDue ?? 0)} left`;
  }
  return undefined;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

/**
 * Build the URL for a filter chip: selecting the value it already has clears it,
 * so a chip is a toggle rather than a one-way door.
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
