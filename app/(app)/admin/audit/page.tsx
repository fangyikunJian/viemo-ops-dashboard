import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ScrollText, ShieldAlert } from "lucide-react";

import { requirePermission } from "@/lib/auth/session";
import {
  listAuditEvents,
  auditSummary,
  AUDIT_PAGE_SIZE,
} from "@/lib/audit/queries";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  HIGH_IMPACT_ACTIONS,
} from "@/lib/audit/vocabulary";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

import { PageHeader, EmptyState } from "@/components/ui/empty-state";
import { FilterChip } from "@/components/ui/filter-chip";

export const metadata: Metadata = { title: "Audit trail" };

const RESOURCES = [
  "relationship",
  "project",
  "user",
  "session",
  "snapshot",
] as const;

export default async function AuditPage({
  searchParams,
}: PageProps<"/admin/audit">) {
  await requirePermission("manage", "user");
  const params = await searchParams;

  const filters = {
    action: single(params.action),
    resource: single(params.resource),
    actorUserId: single(params.actor),
  };
  const page = Number.parseInt(single(params.page) ?? "0", 10) || 0;

  const [{ rows, total, hasMore }, summary] = await Promise.all([
    listAuditEvents(filters, page),
    auditSummary(),
  ]);

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Administration
      </Link>

      <PageHeader
        title="Audit trail"
        description="Who changed what, and when. Append-only — nothing in the application edits or deletes an entry, because a trail that can be rewritten answers no question worth asking."
      />

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-hairline bg-surface px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="eyebrow mr-1 w-14 shrink-0">Action</span>
          {AUDIT_ACTIONS.filter((a) => summary.byAction[a]).map((action) => (
            <FilterChip
              key={action}
              label={AUDIT_ACTION_LABELS[action]}
              count={summary.byAction[action]}
              active={filters.action === action}
              href={hrefWith(params, "action", action)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="eyebrow mr-1 w-14 shrink-0">Record</span>
          {RESOURCES.filter((r) => summary.byResource[r]).map((resource) => (
            <FilterChip
              key={resource}
              label={resource}
              count={summary.byResource[resource]}
              active={filters.resource === resource}
              href={hrefWith(params, "resource", resource)}
            />
          ))}
        </div>

        {summary.actors.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow mr-1 w-14 shrink-0">Person</span>
            {summary.actors
              .filter((a) => a.id)
              .map((actor) => (
                <FilterChip
                  key={actor.id}
                  label={actor.name}
                  count={actor.count}
                  active={filters.actorUserId === actor.id}
                  href={hrefWith(params, "actor", actor.id!)}
                />
              ))}
          </div>
        ) : null}

        {activeFilters > 0 ? (
          <Link
            href="/admin/audit"
            className="inline-block text-xs font-medium text-ink-secondary hover:text-critical"
          >
            Clear {activeFilters} filter{activeFilters === 1 ? "" : "s"}
          </Link>
        ) : null}
      </div>

      {/* ── Entries ────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-surface p-5">
          <EmptyState
            icon={ScrollText}
            title={total === 0 ? "Nothing recorded yet" : "No entries match"}
            description={
              total === 0
                ? "Entries appear here as soon as anyone signs in or changes a record."
                : "Try clearing a filter."
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
          <div className="divide-y divide-line">
            {rows.map((row) => {
              const high = HIGH_IMPACT_ACTIONS.includes(row.action);
              const changes = asChanges(row.metadata);

              return (
                <div
                  key={row.id}
                  className="rail px-4 py-3"
                  style={
                    high
                      ? ({ "--rail-colour": "var(--status-critical)" } as React.CSSProperties)
                      : undefined
                  }
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm text-ink">
                      {high ? (
                        <ShieldAlert
                          className="mr-1.5 inline size-3.5 text-critical"
                          aria-hidden="true"
                        />
                      ) : null}
                      {row.summary}
                    </p>
                    <span className="tabular shrink-0 text-xs text-ink-muted">
                      {formatDate(row.occurredAt)}{" "}
                      {row.occurredAt.toLocaleTimeString("en-AU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-ink-muted">
                    <span
                      className={cn(
                        "font-medium",
                        high ? "text-critical" : "text-ink-secondary",
                      )}
                    >
                      {AUDIT_ACTION_LABELS[row.action] ?? row.action}
                    </span>
                    {" · "}
                    {row.actorName}
                    {row.actorRole !== "SYSTEM"
                      ? ` (${row.actorRole.toLowerCase()})`
                      : ""}
                    {" · "}
                    {row.resource}
                  </p>

                  {changes.length > 0 ? (
                    <ul className="mt-1.5 space-y-0.5">
                      {changes.map(([field, { from, to }]) => (
                        <li key={field} className="text-xs text-ink-secondary">
                          <span className="tabular text-ink-muted">{field}</span>
                          {": "}
                          <span className="text-ink-muted line-through">{from}</span>
                          {" → "}
                          <span className="text-ink">{to}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">
          {total === 0
            ? "No entries"
            : `${page * AUDIT_PAGE_SIZE + 1}–${page * AUDIT_PAGE_SIZE + rows.length} of ${total}`}
        </p>
        <div className="flex gap-2">
          {page > 0 ? (
            <Link
              href={hrefWith(params, "page", String(page - 1), true)}
              className="rounded-lg border border-hairline px-2.5 py-1 text-xs text-ink-secondary hover:bg-sunken hover:text-ink"
            >
              Newer
            </Link>
          ) : null}
          {hasMore ? (
            <Link
              href={hrefWith(params, "page", String(page + 1), true)}
              className="rounded-lg border border-hairline px-2.5 py-1 text-xs text-ink-secondary hover:bg-sunken hover:text-ink"
            >
              Older
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Turn the stored metadata into displayable field changes, or nothing. */
function asChanges(
  metadata: unknown,
): [string, { from: string; to: string }][] {
  if (!metadata || typeof metadata !== "object") return [];
  return Object.entries(metadata as Record<string, unknown>).filter(
    (entry): entry is [string, { from: string; to: string }] => {
      const value = entry[1];
      return (
        typeof value === "object" &&
        value !== null &&
        "from" in value &&
        "to" in value
      );
    },
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
  keepPage = false,
): string {
  const next = new URLSearchParams();

  for (const [existingKey, existingValue] of Object.entries(params)) {
    const flat = Array.isArray(existingValue) ? existingValue[0] : existingValue;
    // Changing a filter resets paging — page 4 of a different filter is
    // almost never where the reader wanted to land.
    if (existingKey === "page" && !keepPage) continue;
    if (flat && existingKey !== key) next.set(existingKey, flat);
  }

  const current = params[key];
  const flatCurrent = Array.isArray(current) ? current[0] : current;
  if (flatCurrent !== value) next.set(key, value);

  const query = next.toString();
  return query ? `/admin/audit?${query}` : "/admin/audit";
}
