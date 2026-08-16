/**
 * The only code permitted to write `Relationship.lastContactAt`.
 *
 * That field is denormalised: it duplicates something derivable from the
 * interaction history. The duplication is deliberate — the dashboard computes a
 * cadence status for every relationship at once, and deriving each one from an
 * aggregate over its interactions would turn one query into a query per row.
 *
 * The price of denormalising is that the copy can drift from the truth. This
 * module is how that price is paid: every write to the interaction log goes
 * through here, and every one of them recomputes `lastContactAt` from scratch
 * inside the same transaction. Recomputing rather than comparing against the
 * existing value is what makes backdated entries, edits and deletions all come
 * out right — a naive `if (newDate > lastContactAt)` would silently leave the
 * field stale when the most recent interaction is removed.
 */

import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export type RecordInteractionInput = {
  relationshipId: string;
  occurredAt: Date;
  channel: string;
  summary: string;
  isSubstantive: boolean;
  loggedById: string;
  projectId?: string | null;
};

/**
 * Recompute the relationship's last contact from its interaction history.
 *
 * Only substantive interactions count. Forwarding an article is contact, but it
 * is not the conversation the cadence exists to make sure happens, so it must
 * not reset the clock.
 */
export async function syncLastContact(
  tx: Tx,
  relationshipId: string,
): Promise<Date | null> {
  const latest = await tx.interaction.findFirst({
    where: { relationshipId, isSubstantive: true },
    orderBy: { occurredAt: "desc" },
    select: { occurredAt: true },
  });

  const lastContactAt = latest?.occurredAt ?? null;

  await tx.relationship.update({
    where: { id: relationshipId },
    data: { lastContactAt },
  });

  return lastContactAt;
}

export async function recordInteraction(input: RecordInteractionInput) {
  return prisma.$transaction(async (tx) => {
    const interaction = await tx.interaction.create({
      data: {
        relationshipId: input.relationshipId,
        occurredAt: input.occurredAt,
        channel: input.channel,
        summary: input.summary,
        isSubstantive: input.isSubstantive,
        loggedById: input.loggedById,
        projectId: input.projectId ?? null,
      },
    });

    await syncLastContact(tx, input.relationshipId);
    return interaction;
  });
}

export async function updateInteraction(
  id: string,
  input: Omit<RecordInteractionInput, "relationshipId" | "loggedById">,
) {
  return prisma.$transaction(async (tx) => {
    const interaction = await tx.interaction.update({
      where: { id },
      data: {
        occurredAt: input.occurredAt,
        channel: input.channel,
        summary: input.summary,
        isSubstantive: input.isSubstantive,
        projectId: input.projectId ?? null,
      },
    });

    await syncLastContact(tx, interaction.relationshipId);
    return interaction;
  });
}

export async function deleteInteraction(id: string) {
  return prisma.$transaction(async (tx) => {
    const interaction = await tx.interaction.delete({ where: { id } });
    await syncLastContact(tx, interaction.relationshipId);
    return interaction;
  });
}
