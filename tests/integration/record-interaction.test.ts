/**
 * Integration tests for the one denormalised field in the schema.
 *
 * `Relationship.lastContactAt` duplicates something derivable from the
 * interaction log, and the whole cadence feature reads from it. The unit tests
 * in lib/brm/cadence.test.ts prove the arithmetic; these prove the field the
 * arithmetic reads is actually kept true, against a real database, through
 * every route that writes to the log.
 *
 * Each run gets its own throwaway Postgres database, built by executing the
 * project's real migrations — so the tests exercise the same schema the
 * application does, and a schema change that breaks the invariant fails here
 * rather than in production.
 *
 * Needs a Postgres. `npm run db:up` provides one locally; CI supplies its own.
 */

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const BASE_URL =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:51214/viemo?sslmode=disable";

/**
 * Isolation is per-schema, not per-database.
 *
 * A database per run was the first attempt and does not work against the local
 * development Postgres: `CREATE DATABASE` reports success and the name appears
 * in `pg_database`, but connecting to it lands back in `template1` — the name
 * is ignored. A dedicated schema behaves correctly on both that server and a
 * real Postgres, so it is what the tests use.
 */
const TEST_SCHEMA = `test_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

type Loaded = {
  prisma: (typeof import("@/lib/db"))["prisma"];
  recordInteraction: (typeof import("@/lib/brm/record-interaction"))["recordInteraction"];
  updateInteraction: (typeof import("@/lib/brm/record-interaction"))["updateInteraction"];
  deleteInteraction: (typeof import("@/lib/brm/record-interaction"))["deleteInteraction"];
};

let mod: Loaded;
let ownerId: string;
let relationshipId: string;

async function createTestSchema() {
  const client = new Client({ connectionString: BASE_URL });
  await client.connect();
  await client.query(`CREATE SCHEMA "${TEST_SCHEMA}"`);
  await client.query(`SET search_path TO "${TEST_SCHEMA}"`);

  // Apply the project's own migrations rather than pushing the schema, so the
  // migration files themselves are covered by the test.
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  for (const entry of readdirSync(migrationsDir).sort()) {
    const sqlFile = path.join(migrationsDir, entry, "migration.sql");
    if (existsSync(sqlFile)) await client.query(readFileSync(sqlFile, "utf8"));
  }
  await client.end();
}

async function dropTestSchema() {
  const client = new Client({ connectionString: BASE_URL });
  await client.connect();
  await client.query(`DROP SCHEMA IF EXISTS "${TEST_SCHEMA}" CASCADE`);
  await client.end();
}

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

function daysAfterCreation(days: number): Date {
  const date = new Date(CREATED_AT);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

beforeAll(async () => {
  await createTestSchema();

  // lib/db reads both of these when the module first loads, so they have to be
  // set before anything imports it — hence the dynamic imports below. The pg
  // adapter takes the schema as an option rather than a connection-string
  // parameter, which is why a `?schema=` in the URL would be ignored.
  process.env.DATABASE_URL = BASE_URL;
  process.env.DATABASE_SCHEMA = TEST_SCHEMA;

  const [{ prisma }, recordModule] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/brm/record-interaction"),
  ]);

  mod = {
    prisma,
    recordInteraction: recordModule.recordInteraction,
    updateInteraction: recordModule.updateInteraction,
    deleteInteraction: recordModule.deleteInteraction,
  };
}, 60_000);

afterAll(async () => {
  await mod?.prisma.$disconnect();
  await dropTestSchema();
  delete process.env.DATABASE_SCHEMA;
}, 60_000);

beforeEach(async () => {
  const { prisma } = mod;
  await prisma.interaction.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.teamMember.deleteMany();

  const owner = await prisma.teamMember.create({
    data: { name: "Avery Nakamura", title: "Studio Director" },
  });
  ownerId = owner.id;

  const relationship = await prisma.relationship.create({
    data: {
      name: "Lumen Ventures",
      type: "INVESTOR",
      status: "ACTIVE",
      cadenceDays: 30,
      ownerId,
      createdAt: CREATED_AT,
    },
  });
  relationshipId = relationship.id;
});

async function lastContact(): Promise<Date | null> {
  const row = await mod.prisma.relationship.findUniqueOrThrow({
    where: { id: relationshipId },
    select: { lastContactAt: true },
  });
  return row.lastContactAt;
}

async function log(dayOffset: number, isSubstantive = true) {
  return mod.recordInteraction({
    relationshipId,
    occurredAt: daysAfterCreation(dayOffset),
    channel: "MEETING",
    summary: `Interaction on day ${dayOffset}`,
    isSubstantive,
    loggedById: ownerId,
  });
}

describe("recording an interaction", () => {
  it("starts with no recorded contact", async () => {
    expect(await lastContact()).toBeNull();
  });

  it("sets the last contact to the interaction's date", async () => {
    await log(10);
    expect(await lastContact()).toEqual(daysAfterCreation(10));
  });

  it("moves the last contact forward when a newer one is logged", async () => {
    await log(10);
    await log(40);
    expect(await lastContact()).toEqual(daysAfterCreation(40));
  });

  it("leaves the last contact alone when an older one is backfilled", async () => {
    // Someone catching up on their notes must not make the relationship look
    // like it has just been contacted.
    await log(40);
    await log(10);
    expect(await lastContact()).toEqual(daysAfterCreation(40));
  });

  it("does not count an interaction marked as not substantive", async () => {
    await log(10);
    await log(40, false);
    expect(await lastContact()).toEqual(daysAfterCreation(10));
  });

  it("leaves the last contact null when the only interaction is incidental", async () => {
    await log(10, false);
    expect(await lastContact()).toBeNull();
  });
});

describe("editing an interaction", () => {
  it("follows the date when the most recent one is moved", async () => {
    const interaction = await log(40);
    await mod.updateInteraction(interaction.id, {
      occurredAt: daysAfterCreation(55),
      channel: "CALL",
      summary: "Moved",
      isSubstantive: true,
      projectId: null,
    });
    expect(await lastContact()).toEqual(daysAfterCreation(55));
  });

  it("falls back to the previous one when the latest is downgraded to incidental", async () => {
    await log(10);
    const latest = await log(40);

    await mod.updateInteraction(latest.id, {
      occurredAt: latest.occurredAt,
      channel: latest.channel,
      summary: latest.summary,
      isSubstantive: false,
      projectId: null,
    });

    expect(await lastContact()).toEqual(daysAfterCreation(10));
  });

  it("picks an interaction up when it is promoted to substantive", async () => {
    await log(10);
    const incidental = await log(40, false);

    await mod.updateInteraction(incidental.id, {
      occurredAt: incidental.occurredAt,
      channel: incidental.channel,
      summary: incidental.summary,
      isSubstantive: true,
      projectId: null,
    });

    expect(await lastContact()).toEqual(daysAfterCreation(40));
  });
});

describe("deleting an interaction", () => {
  it("falls back to the next most recent", async () => {
    // The case a naive "only move the date forward" implementation gets wrong:
    // removing the latest interaction has to walk the value backwards.
    await log(10);
    const latest = await log(40);

    await mod.deleteInteraction(latest.id);

    expect(await lastContact()).toEqual(daysAfterCreation(10));
  });

  it("returns to null when the last one is removed", async () => {
    const only = await log(10);
    await mod.deleteInteraction(only.id);
    expect(await lastContact()).toBeNull();
  });

  it("skips over incidental interactions when falling back", async () => {
    await log(10);
    await log(20, false);
    const latest = await log(40);

    await mod.deleteInteraction(latest.id);

    expect(await lastContact()).toEqual(daysAfterCreation(10));
  });
});

describe("the field and the cadence calculation together", () => {
  it("takes a relationship from overdue to on track when contact is logged", async () => {
    const { computeCadence } = await import("@/lib/brm/cadence");
    const now = daysAfterCreation(100);

    const before = await mod.prisma.relationship.findUniqueOrThrow({
      where: { id: relationshipId },
    });
    expect(computeCadence(before, now).status).toBe("OVERDUE");

    await log(98);

    const after = await mod.prisma.relationship.findUniqueOrThrow({
      where: { id: relationshipId },
    });
    expect(computeCadence(after, now).status).toBe("ON_TRACK");
  });
});
