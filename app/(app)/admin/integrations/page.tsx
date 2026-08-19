import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleSlash, Download, Plug } from "lucide-react";

import { requirePermission } from "@/lib/auth/session";
import { ADAPTERS } from "@/lib/integration/adapters";
import { AGENT_ADAPTERS, DEFAULT_BUDGET, PROPOSAL_KIND_LABELS } from "@/lib/integration/agent-port";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Integrations" };

const CAPABILITY_LABELS: Record<string, string> = {
  "export-projects": "Export projects",
  "export-relationships": "Export relationships",
  "push-projects": "Push projects",
  "push-relationships": "Push relationships",
};

export default async function IntegrationsPage() {
  await requirePermission("manage", "user");

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Administration
      </Link>

      <PageHeader
        title="Integrations"
        description="The extension seam. This system holds the data; adapters registered here are how it could later reach other tools without either module being reopened."
      />

      <Card>
        <CardHeader
          title="Why a seam rather than a connection"
          description="Worth reading before adding an adapter."
        />
        <CardBody className="space-y-3 text-sm text-ink-secondary">
          <p>
            The project is specified as greenfield and self-contained, running on
            synthetic data with no connection to any live or confidential system.
            The shared data model is the product&rsquo;s spine and a deliverable
            in its own right, so it stays the source of truth.
          </p>
          <p>
            What a future team needs is therefore not a live connection now, but
            a boundary at which one can be added later. An adapter implements the
            interface in{" "}
            <code className="rounded bg-sunken px-1 text-xs">
              lib/integration/types.ts
            </code>{" "}
            and is registered in{" "}
            <code className="rounded bg-sunken px-1 text-xs">
              lib/integration/adapters.ts
            </code>
            . Nothing in the BRM module, the PM module or the schema changes.
          </p>
        </CardBody>
      </Card>

      <p className="eyebrow">Outbound adapters</p>

      <div className="space-y-4">
        {ADAPTERS.map((adapter) => (
          <Card key={adapter.id}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  {adapter.implemented ? (
                    <Plug className="size-4 text-good" aria-hidden="true" />
                  ) : (
                    <CircleSlash
                      className="size-4 text-ink-muted"
                      aria-hidden="true"
                    />
                  )}
                  {adapter.label}
                  <Badge tone={adapter.implemented ? "emerald" : "slate"}>
                    {adapter.implemented ? "Available" : "Stub"}
                  </Badge>
                </span>
              }
              description={adapter.description}
              action={
                adapter.id === "json-export" ? (
                  <a
                    href="/api/export"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-xs font-medium text-accent-ink hover:brightness-110"
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                    Export now
                  </a>
                ) : null
              }
            />
            <CardBody>
              <p className="text-xs font-medium text-ink-muted">Capabilities</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {adapter.capabilities.map((capability) => (
                  <Badge key={capability} tone="blue">
                    {CAPABILITY_LABELS[capability] ?? capability}
                  </Badge>
                ))}
              </div>

              {!adapter.implemented ? (
                <p className="mt-3 text-xs text-ink-secondary">
                  Documented but not built. See the comment above{" "}
                  <code className="rounded bg-sunken px-1">
                    {adapter.id}StubAdapter
                  </code>{" "}
                  for the three things that would have to be settled first —
                  credentials, a field mapping that loses nothing important, and
                  a conflict policy.
                </p>
              ) : null}
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="The agent seam"
          description="Where an AI workflow agent plugs in — and the rules it has to obey."
        />
        <CardBody className="space-y-3 text-sm text-ink-secondary">
          <p>
            An agent gets a read-only snapshot and returns{" "}
            <strong className="text-ink">proposals</strong>. There is no path
            from the interface to a database write: a proposal becomes a change
            only when a person approves it, through the same permission checks
            as anything else. An agent can never do what the person driving it
            could not do themselves.
          </p>
          <p>
            Every run reports what it cost, and every run is capped before it
            starts — currently{" "}
            <strong className="text-ink">{DEFAULT_BUDGET.maxCents}c</strong> and{" "}
            <strong className="text-ink">{DEFAULT_BUDGET.maxProposals} proposals</strong>{" "}
            per run. An adapter that hits a ceiling has to say so rather than
            quietly returning less.
          </p>
        </CardBody>
      </Card>

      {AGENT_ADAPTERS.map((adapter) => (
        <Card key={adapter.id}>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                {adapter.implemented ? (
                  <Plug className="size-4 text-good" aria-hidden="true" />
                ) : (
                  <CircleSlash className="size-4 text-ink-muted" aria-hidden="true" />
                )}
                {adapter.label}
                <Badge tone={adapter.implemented ? "emerald" : "slate"}>
                  {adapter.implemented ? "Available" : "Stub"}
                </Badge>
              </span>
            }
            description={adapter.description}
          />
          <CardBody>
            <p className="text-xs font-medium text-ink-muted">Can propose</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {adapter.kinds.map((kind) => (
                <Badge key={kind} tone="blue">
                  {PROPOSAL_KIND_LABELS[kind]}
                </Badge>
              ))}
            </div>
            {!adapter.implemented ? (
              <p className="mt-3 text-xs text-ink-secondary">
                Three things need settling before this can be built: where the
                API key lives, what a run actually costs, and who approves a
                proposal and how quickly. The last is a workflow decision for
                the client, not a technical one.
              </p>
            ) : null}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}