/**
 * The Prisma client, as a single shared instance.
 *
 * Next.js reloads modules on every edit in development, which would otherwise
 * open a new connection pool each time until the database runs out of slots.
 * Stashing the client on globalThis outside production keeps one pool across
 * reloads. This is the standard Prisma + Next.js arrangement.
 *
 * The connection string is the only thing that differs between a developer's
 * machine, CI and the deployed instance — nothing else in the application knows
 * where the database is. See docs/adr/0009 for why it is Postgres.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env, then run `npm run db:up` " +
      "for a local database or point it at your own Postgres.",
  );
}

/**
 * Optional Postgres schema.
 *
 * Unset in normal use, where Prisma writes to `public`. The integration tests
 * set it so each run gets its own schema and cannot destroy a developer's
 * seeded data; a deployment that shares a database with something else can use
 * it for the same reason.
 */
const DATABASE_SCHEMA = process.env.DATABASE_SCHEMA;

function createPrismaClient() {
  const adapter = new PrismaPg(
    { connectionString: DATABASE_URL },
    DATABASE_SCHEMA ? { schema: DATABASE_SCHEMA } : undefined,
  );
  return new PrismaClient({ adapter });
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientInstance;
};

export const prisma: PrismaClientInstance =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
