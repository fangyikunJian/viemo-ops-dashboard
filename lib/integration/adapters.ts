/**
 * The adapters registered against the integration port.
 *
 * One is real and one is a stub, on purpose. The real one proves the seam works
 * end to end rather than being an interface nobody has ever run through. The
 * stub documents, in code a future team can read and compile against, exactly
 * what implementing a live integration would involve.
 */

import type {
  IntegrationAdapter,
  OutboundProject,
  OutboundSnapshot,
  SyncResult,
} from "./types";

/**
 * Writes the whole operating picture out as JSON.
 *
 * Real, and useful now: it is how a snapshot leaves the system for a report, a
 * spreadsheet or a hand-off, and it is the reference implementation any other
 * adapter can be read against.
 */
export const jsonExportAdapter: IntegrationAdapter = {
  id: "json-export",
  label: "JSON export",
  description:
    "Serialises every project and relationship, with their tasks and cadence, as a single JSON document.",
  capabilities: ["export-projects", "export-relationships"],
  implemented: true,

  async exportSnapshot(snapshot: OutboundSnapshot): Promise<SyncResult> {
    const payload = JSON.stringify(snapshot, null, 2);
    return {
      ok: true,
      detail: `${snapshot.projects.length} projects and ${snapshot.relationships.length} relationships, ${payload.length} bytes.`,
      payload,
    };
  },
};

/**
 * What a Jira integration would have to do, written down but not built.
 *
 * Deliberately unimplemented. Three things stand between this stub and a
 * working adapter, and they are worth stating rather than discovering:
 *
 *  1. **Credentials and a tenant.** Jira Cloud needs a site URL, an account
 *     email and an API token, held as secrets rather than in the repository.
 *     The application currently has no secret store, because it has never
 *     needed one.
 *  2. **A field mapping that loses nothing important.** A Jira issue has no
 *     notion of a relationship, a contact cadence, or value flowing in two
 *     directions. Projects and tasks map across cleanly enough; the BRM half of
 *     the model has no counterpart, which is the clearest statement of why this
 *     system is not a Jira front end.
 *  3. **A conflict policy.** Once a task exists in both systems, something has
 *     to decide which side wins when both change. That is a product decision
 *     for the client, not a technical one, and it should be settled before any
 *     code is written.
 *
 * Until those are answered, an honest stub is worth more than a half-working
 * connection.
 */
export const jiraStubAdapter: IntegrationAdapter = {
  id: "jira",
  label: "Jira (not implemented)",
  description:
    "Would mirror projects and tasks into a Jira Cloud project. Requires credentials, an agreed field mapping and a conflict policy before it can be built.",
  capabilities: ["push-projects"],
  implemented: false,

  async pushProject(project: OutboundProject): Promise<SyncResult> {
    return {
      ok: false,
      error: `Jira integration is not implemented. Pushing "${project.name}" would need a configured Jira site, an agreed mapping from project status to Jira workflow states, and a policy for which side wins when a task changes in both.`,
    };
  },
};

export const ADAPTERS: readonly IntegrationAdapter[] = [
  jsonExportAdapter,
  jiraStubAdapter,
];

export function findAdapter(id: string): IntegrationAdapter | undefined {
  return ADAPTERS.find((adapter) => adapter.id === id);
}
