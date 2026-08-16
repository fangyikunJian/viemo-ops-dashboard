import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Building2,
  CalendarClock,
  FolderKanban,
  Mail,
  Pencil,
  Phone,
  Star,
  Trash2,
  User,
} from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getRelationship } from "@/lib/brm/queries";
import { describeLastContact } from "@/lib/brm/cadence";
import { computeProjectHealth, progressPercent } from "@/lib/pm/project-health";
import {
  archiveRelationshipAction,
  deleteContactAction,
  deleteInteractionAction,
  deleteRelationshipAction,
  toggleSubstantiveAction,
} from "@/lib/brm/actions";
import { prisma } from "@/lib/db";
import { formatDate, formatDays } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/bar-list";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CadenceBadge,
  InteractionChannelBadge,
  ProjectStatusBadge,
  RelationshipStatusBadge,
  RelationshipTypeBadge,
} from "@/components/domain/badges";
import { LogInteractionForm } from "@/components/brm/log-interaction-form";
import { AddContactForm } from "@/components/brm/contact-form";

export async function generateMetadata({
  params,
}: PageProps<"/relationships/[id]">): Promise<Metadata> {
  const { id } = await params;
  const relationship = await prisma.relationship.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: relationship?.name ?? "Relationship" };
}

export default async function RelationshipDetailPage({
  params,
}: PageProps<"/relationships/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const now = new Date();
  const relationship = await getRelationship(id, now);
  if (!relationship) notFound();

  const projects = await prisma.project.findMany({
    where: { status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const canEdit = can(user.role, "edit", "relationship");
  const canArchive = can(user.role, "archive", "relationship");
  const canDelete = can(user.role, "delete", "relationship");
  const canLog = can(user.role, "create", "interaction");
  const { cadence } = relationship;

  return (
    <div className="space-y-6">
      <Link
        href="/relationships"
        className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All relationships
      </Link>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {relationship.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RelationshipTypeBadge type={relationship.type} />
            <RelationshipStatusBadge status={relationship.status} />
            <CadenceBadge
              status={cadence.status}
              detail={
                cadence.status === "OVERDUE"
                  ? `${formatDays(cadence.daysOverdue ?? 0)} over`
                  : cadence.status === "DUE_SOON"
                    ? `${formatDays(cadence.daysUntilDue ?? 0)} left`
                    : undefined
              }
            />
            {relationship.tags.map((tag) => (
              <Badge key={tag.id} tone="slate">
                {tag.label}
              </Badge>
            ))}
          </div>
          {relationship.organisation ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-secondary">
              <Building2 className="size-3.5" aria-hidden="true" />
              {relationship.organisation.name}
              {relationship.organisation.website ? (
                <a
                  href={relationship.organisation.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent hover:underline"
                >
                  {relationship.organisation.website}
                </a>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canEdit ? (
            <ButtonLink href={`/relationships/${relationship.id}/edit`} size="sm">
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </ButtonLink>
          ) : null}
          {canArchive ? (
            <form action={archiveRelationshipAction}>
              <input type="hidden" name="id" value={relationship.id} />
              <input type="hidden" name="status" value={relationship.status} />
              <Button type="submit" size="sm">
                <Archive className="size-3.5" aria-hidden="true" />
                {relationship.status === "ARCHIVED" ? "Restore" : "Archive"}
              </Button>
            </form>
          ) : null}
          {canDelete ? (
            <form action={deleteRelationshipAction}>
              <input type="hidden" name="id" value={relationship.id} />
              <Button type="submit" size="sm" variant="danger">
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ── Interaction history ──────────────────────────── */}
          <Card>
            <CardHeader
              title="Interaction history"
              description={`${relationship.interactions.length} logged. Only substantive ones reset the contact clock.`}
            />
            {canLog ? (
              <CardBody className="border-b border-line bg-sunken/50">
                <LogInteractionForm
                  relationshipId={relationship.id}
                  projects={projects}
                />
              </CardBody>
            ) : null}
            <CardBody className="p-0">
              {relationship.interactions.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={CalendarClock}
                    title="No interactions logged"
                    description="The contact clock runs from when this relationship was added until the first one is recorded."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {relationship.interactions.map((interaction) => (
                    <li key={interaction.id} className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <InteractionChannelBadge
                            channel={interaction.channel}
                          />
                          <span className="tabular text-xs text-ink-muted">
                            {formatDate(interaction.occurredAt)}
                          </span>
                          {!interaction.isSubstantive ? (
                            <span className="text-xs text-ink-muted italic">
                              does not reset the clock
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1">
                          {can(user.role, "edit", "interaction") ? (
                            <form action={toggleSubstantiveAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={interaction.id}
                              />
                              <button
                                type="submit"
                                className="rounded px-1.5 py-0.5 text-xs text-ink-muted hover:bg-sunken hover:text-ink"
                                title="Toggle whether this interaction resets the contact clock"
                              >
                                {interaction.isSubstantive
                                  ? "Mark incidental"
                                  : "Mark substantive"}
                              </button>
                            </form>
                          ) : null}
                          {can(user.role, "delete", "interaction") ? (
                            <form action={deleteInteractionAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={interaction.id}
                              />
                              <input
                                type="hidden"
                                name="relationshipId"
                                value={relationship.id}
                              />
                              <button
                                type="submit"
                                className="rounded p-1 text-ink-muted hover:bg-sunken hover:text-critical"
                                aria-label="Delete interaction"
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" />
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-1.5 text-sm text-ink">
                        {interaction.summary}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        Logged by {interaction.loggedBy.name}
                        {interaction.project ? (
                          <>
                            {" · about "}
                            <Link
                              href={`/projects/${interaction.project.id}`}
                              className="text-accent hover:underline"
                            >
                              {interaction.project.name}
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {/* ── Cadence ──────────────────────────────────────── */}
          <Card>
            <CardHeader title="Contact rhythm" />
            <CardBody className="space-y-3 text-sm">
              <Row label="Agreed cadence">
                {relationship.cadenceDays
                  ? `Every ${relationship.cadenceDays} days`
                  : "Not tracked"}
              </Row>
              <Row label="Last contact">
                {describeLastContact(cadence).replace("Contacted ", "")}
              </Row>
              <Row label="Next due">
                {cadence.dueAt ? formatDate(cadence.dueAt) : "—"}
              </Row>
              <Row label="Owner">{relationship.owner.name}</Row>
            </CardBody>
          </Card>

          {/* ── Value both ways ──────────────────────────────── */}
          {relationship.valueToUs || relationship.valueToThem ? (
            <Card>
              <CardHeader title="Value, both ways" />
              <CardBody className="space-y-3">
                {relationship.valueToUs ? (
                  <div>
                    <p className="text-xs font-medium text-ink-muted">
                      They give us
                    </p>
                    <p className="mt-0.5 text-sm text-ink">
                      {relationship.valueToUs}
                    </p>
                  </div>
                ) : null}
                {relationship.valueToThem ? (
                  <div>
                    <p className="text-xs font-medium text-ink-muted">
                      We give them
                    </p>
                    <p className="mt-0.5 text-sm text-ink">
                      {relationship.valueToThem}
                    </p>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          {/* ── Contacts ─────────────────────────────────────── */}
          <Card>
            <CardHeader title="People" />
            <CardBody className="space-y-3">
              {relationship.contacts.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No individual contacts recorded.
                </p>
              ) : (
                <ul className="space-y-3">
                  {relationship.contacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                          <User className="size-3.5 text-ink-muted" aria-hidden="true" />
                          {contact.name}
                          {contact.isPrimary ? (
                            <Star
                              className="size-3 fill-current text-warning"
                              aria-label="Primary contact"
                            />
                          ) : null}
                        </p>
                        {contact.role ? (
                          <p className="mt-0.5 text-xs text-ink-secondary">
                            {contact.role}
                          </p>
                        ) : null}
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="mt-0.5 flex items-center gap-1 text-xs text-accent hover:underline"
                          >
                            <Mail className="size-3" aria-hidden="true" />
                            {contact.email}
                          </a>
                        ) : null}
                        {contact.phone ? (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-secondary">
                            <Phone className="size-3" aria-hidden="true" />
                            {contact.phone}
                          </p>
                        ) : null}
                      </div>
                      {can(user.role, "delete", "contact") ? (
                        <form action={deleteContactAction}>
                          <input type="hidden" name="id" value={contact.id} />
                          <input
                            type="hidden"
                            name="relationshipId"
                            value={relationship.id}
                          />
                          <button
                            type="submit"
                            className="rounded p-1 text-ink-muted hover:text-critical"
                            aria-label={`Remove ${contact.name}`}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {can(user.role, "create", "contact") ? (
                <AddContactForm relationshipId={relationship.id} />
              ) : null}
            </CardBody>
          </Card>

          {/* ── Linked projects — the seam into the PM module ── */}
          <Card>
            <CardHeader
              title="Project work"
              description="Projects being delivered for or with this relationship."
            />
            <CardBody className="p-0">
              {relationship.projects.length === 0 ? (
                <div className="px-5 py-4">
                  <p className="text-sm text-ink-muted">
                    No projects linked to this relationship.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {relationship.projects.map((project) => {
                    const health = computeProjectHealth(project, now);
                    return (
                      <li key={project.id}>
                        <Link
                          href={`/projects/${project.id}`}
                          className="block px-5 py-3 hover:bg-sunken"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-ink">
                              <FolderKanban
                                className="mr-1.5 inline size-3.5 text-ink-muted"
                                aria-hidden="true"
                              />
                              {project.name}
                            </p>
                            <ProjectStatusBadge status={project.status} />
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <ProgressBar percent={progressPercent(health)} />
                            <span className="tabular shrink-0 text-xs text-ink-muted">
                              {progressPercent(health)}%
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

          {/* ── Notes ────────────────────────────────────────── */}
          {relationship.notes ? (
            <Card>
              <CardHeader title="Notes" />
              <CardBody>
                <p className="text-sm whitespace-pre-wrap text-ink-secondary">
                  {relationship.notes}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-ink-muted">{label}</span>
      <span className="text-right text-sm text-ink">{children}</span>
    </div>
  );
}
