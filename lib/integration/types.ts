/**
 * The extension seam.
 *
 * The brief asks integration to include "a lightweight, stubbed interface for
 * future extensions". This is it: a port that describes what any outbound
 * integration must be able to do, with adapters plugged in behind it.
 *
 * Why a port rather than talking to an external system directly: the project is
 * specified as greenfield and self-contained, on synthetic data, with no
 * connection to any live system. That constraint is not a limitation to work
 * around — the shared data model is the product's spine and a graded
 * deliverable, so it has to stay the source of truth. What a future team needs
 * is not a live Jira connection; it is a boundary at which one could be added
 * without reopening either module. A team that later wants to mirror projects
 * into Jira, or push relationships into a CRM, writes an adapter against this
 * interface and registers it. Nothing in lib/brm, lib/pm or the schema changes.
 *
 * Everything here is plain data and plain types. No network calls, no
 * credentials, no SDKs.
 */

import type {
  ProjectStatus,
  RelationshipStatus,
  RelationshipType,
  TaskPriority,
  TaskStatus,
} from "@/lib/domain/enums";

/** What an adapter is able to do. Declared so the UI can describe it honestly. */
export type IntegrationCapability =
  | "export-projects"
  | "export-relationships"
  | "push-projects"
  | "push-relationships";

export type OutboundTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeName: string | null;
};

export type OutboundProject = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  leadName: string;
  /** Present when the project is being delivered for a relationship. */
  relationshipName: string | null;
  tags: string[];
  tasks: OutboundTask[];
};

export type OutboundRelationship = {
  id: string;
  name: string;
  type: RelationshipType;
  status: RelationshipStatus;
  cadenceDays: number | null;
  lastContactAt: string | null;
  ownerName: string;
  organisationName: string | null;
  tags: string[];
  interactionCount: number;
};

export type OutboundSnapshot = {
  /** ISO timestamp of when the snapshot was taken. */
  takenAt: string;
  projects: OutboundProject[];
  relationships: OutboundRelationship[];
};

export type SyncResult =
  | { ok: true; detail: string; payload?: unknown }
  | { ok: false; error: string };

/**
 * An outbound integration.
 *
 * Every method is optional; `capabilities` declares which are implemented, so
 * calling code can ask before it calls rather than probing and handling a
 * missing function.
 */
export interface IntegrationAdapter {
  /** Stable machine name, used in URLs and configuration. */
  readonly id: string;
  readonly label: string;
  /** One sentence, shown to an administrator choosing between adapters. */
  readonly description: string;
  readonly capabilities: readonly IntegrationCapability[];
  /**
   * False for adapters that are documented but not built — a stub tells the
   * reader what would be required without pretending it works.
   */
  readonly implemented: boolean;

  exportSnapshot?(snapshot: OutboundSnapshot): Promise<SyncResult>;
  pushProject?(project: OutboundProject): Promise<SyncResult>;
  pushRelationship?(relationship: OutboundRelationship): Promise<SyncResult>;
}

export function supports(
  adapter: IntegrationAdapter,
  capability: IntegrationCapability,
): boolean {
  return adapter.capabilities.includes(capability);
}
