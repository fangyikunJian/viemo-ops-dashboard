"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import {
  interactionChannelSchema,
  relationshipStatusSchema,
  relationshipTypeSchema,
} from "@/lib/domain/enums";
import { fromDateInputValue } from "@/lib/format";
import {
  fieldErrorsFrom,
  optionalInteger,
  optionalText,
  tagLabels,
  text,
  type ActionState,
} from "@/lib/form-state";
import {
  deleteInteraction,
  recordInteraction,
  updateInteraction,
} from "./record-interaction";

// ═══════════════════════════════════════════════════════════════════
//  Schemas
// ═══════════════════════════════════════════════════════════════════

const relationshipSchema = z.object({
  name: z
    .string()
    .min(1, "Give the relationship a name.")
    .max(120, "Keep the name under 120 characters."),
  type: relationshipTypeSchema,
  status: relationshipStatusSchema,
  cadenceDays: z
    .number()
    .int()
    .positive("A cadence must be at least one day.")
    .max(3650, "A cadence longer than ten years is not a cadence.")
    .nullable(),
  ownerId: z.string().min(1, "Choose who owns this relationship."),
  organisationId: z.string().nullable(),
  valueToUs: z.string().max(600).nullable(),
  valueToThem: z.string().max(600).nullable(),
  notes: z.string().max(4000).nullable(),
});

const interactionSchema = z.object({
  relationshipId: z.string().min(1),
  occurredAt: z.date({ message: "Give the date this happened." }),
  channel: interactionChannelSchema,
  summary: z
    .string()
    .min(1, "Say what happened, even briefly.")
    .max(2000, "Keep the summary under 2000 characters."),
  isSubstantive: z.boolean(),
  projectId: z.string().nullable(),
});

const contactSchema = z.object({
  relationshipId: z.string().min(1),
  name: z.string().min(1, "A contact needs a name.").max(120),
  role: z.string().max(120).nullable(),
  email: z.email("That does not look like an email address.").nullable(),
  phone: z.string().max(40).nullable(),
  isPrimary: z.boolean(),
});

// ═══════════════════════════════════════════════════════════════════
//  Relationships
// ═══════════════════════════════════════════════════════════════════

/**
 * Create or update a relationship.
 *
 * The permission check happens here, on the server, before anything is read out
 * of the form. The list and detail screens also hide the controls a role cannot
 * use, but that is only so people are not shown doors they cannot open — this
 * is the check that actually holds.
 */
export async function saveRelationshipAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = optionalText(formData.get("id"));

  if (!can(user.role, id ? "edit" : "create", "relationship")) {
    return {
      error: `Your role cannot ${id ? "edit" : "create"} relationships.`,
    };
  }

  const parsed = relationshipSchema.safeParse({
    name: text(formData.get("name")),
    type: text(formData.get("type")),
    status: text(formData.get("status")),
    cadenceDays: optionalInteger(formData.get("cadenceDays")),
    ownerId: text(formData.get("ownerId")),
    organisationId: optionalText(formData.get("organisationId")),
    valueToUs: optionalText(formData.get("valueToUs")),
    valueToThem: optionalText(formData.get("valueToThem")),
    notes: optionalText(formData.get("notes")),
  });

  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const labels = tagLabels(formData.get("tags"));
  const tagConnections = await connectTags(labels);

  const data = { ...parsed.data, tags: { set: [], connect: tagConnections } };

  const saved = id
    ? await prisma.relationship.update({ where: { id }, data })
    : await prisma.relationship.create({ data });

  revalidatePath("/relationships");
  revalidatePath("/dashboard");
  redirect(`/relationships/${saved.id}`);
}

/** Move a relationship to ARCHIVED. Reversible, and keeps the history. */
export async function archiveRelationshipAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "archive", "relationship")) return;

  const id = text(formData.get("id"));
  const status = text(formData.get("status")) === "ARCHIVED" ? "DORMANT" : "ARCHIVED";

  await prisma.relationship.update({ where: { id }, data: { status } });

  revalidatePath("/relationships");
  revalidatePath(`/relationships/${id}`);
  revalidatePath("/dashboard");
}

/**
 * Delete a relationship outright, with its contacts and interactions.
 *
 * Administrators only. Archiving is the reversible option and is what members
 * get; this destroys the history that explains why a relationship went the way
 * it did, so it is deliberately harder to reach.
 */
export async function deleteRelationshipAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "delete", "relationship")) return;

  const id = text(formData.get("id"));
  await prisma.relationship.delete({ where: { id } });

  revalidatePath("/relationships");
  revalidatePath("/dashboard");
  redirect("/relationships");
}

// ═══════════════════════════════════════════════════════════════════
//  Interactions
// ═══════════════════════════════════════════════════════════════════

export async function logInteractionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  if (!can(user.role, "create", "interaction")) {
    return { error: "Your role cannot log interactions." };
  }
  if (!user.teamMemberId) {
    return {
      error:
        "Your account is not linked to a team member, so an interaction cannot be attributed. An administrator can link it.",
    };
  }

  const occurredAt = fromDateInputValue(formData.get("occurredAt"));

  const parsed = interactionSchema.safeParse({
    relationshipId: text(formData.get("relationshipId")),
    occurredAt: occurredAt ?? undefined,
    channel: text(formData.get("channel")),
    summary: text(formData.get("summary")),
    isSubstantive: formData.get("isSubstantive") === "on",
    projectId: optionalText(formData.get("projectId")),
  });

  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  if (parsed.data.occurredAt > new Date()) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { occurredAt: "An interaction cannot have happened in the future." },
    };
  }

  await recordInteraction({ ...parsed.data, loggedById: user.teamMemberId });

  revalidatePath(`/relationships/${parsed.data.relationshipId}`);
  revalidatePath("/relationships");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function deleteInteractionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "delete", "interaction")) return;

  const id = text(formData.get("id"));
  const relationshipId = text(formData.get("relationshipId"));

  await deleteInteraction(id);

  revalidatePath(`/relationships/${relationshipId}`);
  revalidatePath("/relationships");
  revalidatePath("/dashboard");
}

/** Toggle whether an interaction counts toward the cadence clock. */
export async function toggleSubstantiveAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "edit", "interaction")) return;

  const id = text(formData.get("id"));
  const existing = await prisma.interaction.findUnique({ where: { id } });
  if (!existing) return;

  await updateInteraction(id, {
    occurredAt: existing.occurredAt,
    channel: existing.channel,
    summary: existing.summary,
    isSubstantive: !existing.isSubstantive,
    projectId: existing.projectId,
  });

  revalidatePath(`/relationships/${existing.relationshipId}`);
  revalidatePath("/dashboard");
}

// ═══════════════════════════════════════════════════════════════════
//  Contacts
// ═══════════════════════════════════════════════════════════════════

export async function saveContactAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!can(user.role, "create", "contact")) {
    return { error: "Your role cannot add contacts." };
  }

  const parsed = contactSchema.safeParse({
    relationshipId: text(formData.get("relationshipId")),
    name: text(formData.get("name")),
    role: optionalText(formData.get("role")),
    email: optionalText(formData.get("email")),
    phone: optionalText(formData.get("phone")),
    isPrimary: formData.get("isPrimary") === "on",
  });

  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  // Only one contact per relationship can be the primary one.
  if (parsed.data.isPrimary) {
    await prisma.contact.updateMany({
      where: { relationshipId: parsed.data.relationshipId },
      data: { isPrimary: false },
    });
  }

  await prisma.contact.create({ data: parsed.data });

  revalidatePath(`/relationships/${parsed.data.relationshipId}`);
  return { ok: true };
}

export async function deleteContactAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "delete", "contact")) return;

  const id = text(formData.get("id"));
  const relationshipId = text(formData.get("relationshipId"));

  await prisma.contact.delete({ where: { id } });
  revalidatePath(`/relationships/${relationshipId}`);
}

// ═══════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════

/** Find or create each tag, returning the connections Prisma expects. */
async function connectTags(labels: string[]): Promise<{ id: string }[]> {
  const connections: { id: string }[] = [];

  for (const label of labels) {
    const tag = await prisma.tag.upsert({
      where: { label },
      create: { label },
      update: {},
      select: { id: true },
    });
    connections.push({ id: tag.id });
  }

  return connections;
}

/** Whether the signed-in user may change BRM records — for hiding controls. */
export async function canEditRelationships(): Promise<boolean> {
  const user = await getSessionUser();
  return user ? can(user.role, "edit", "relationship") : false;
}
