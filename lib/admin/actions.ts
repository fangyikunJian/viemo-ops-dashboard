"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { userRoleSchema } from "@/lib/domain/enums";
import {
  fieldErrorsFrom,
  optionalText,
  text,
  type ActionState,
} from "@/lib/form-state";

const userSchema = z.object({
  email: z.email("That does not look like an email address."),
  name: z.string().min(1, "Give the account a name.").max(120),
  role: userRoleSchema,
  teamMemberId: z.string().nullable(),
});

export async function createUserAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!can(user.role, "manage", "user")) {
    return { error: "Only an administrator can create accounts." };
  }

  const password = String(formData.get("password") ?? "");
  const passwordProblem = validatePassword(password);
  if (passwordProblem) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { password: passwordProblem },
    };
  }

  const parsed = userSchema.safeParse({
    email: text(formData.get("email")).toLowerCase(),
    name: text(formData.get("name")),
    role: text(formData.get("role")),
    teamMemberId: optionalText(formData.get("teamMemberId")),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { email: "An account with that email already exists." },
    };
  }

  // A team member can back at most one account, so a linked one must be free.
  if (parsed.data.teamMemberId) {
    const taken = await prisma.user.findUnique({
      where: { teamMemberId: parsed.data.teamMemberId },
      select: { id: true },
    });
    if (taken) {
      return {
        error: "Check the highlighted fields.",
        fieldErrors: {
          teamMemberId: "That team member already has an account.",
        },
      };
    }
  }

  await prisma.user.create({
    data: { ...parsed.data, passwordHash: await hashPassword(password) },
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const actor = await requireUser();
  if (!can(actor.role, "manage", "user")) return;

  const id = text(formData.get("id"));
  const role = userRoleSchema.safeParse(text(formData.get("role")));
  if (!role.success) return;

  // An administrator must not be able to demote themselves out of the only
  // route back in. Guarding here rather than in the UI, because the UI is not
  // the boundary that holds.
  if (id === actor.id && role.data !== "ADMIN") {
    const otherAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, id: { not: actor.id } },
    });
    if (otherAdmins === 0) return;
  }

  await prisma.user.update({ where: { id }, data: { role: role.data } });
  revalidatePath("/admin");
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const actor = await requireUser();
  if (!can(actor.role, "manage", "user")) return;

  const id = text(formData.get("id"));
  if (id === actor.id) return; // Never let an admin lock themselves out.

  const target = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true, role: true },
  });
  if (!target) return;

  if (target.isActive && target.role === "ADMIN") {
    const otherAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, id: { not: id } },
    });
    if (otherAdmins === 0) return;
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: !target.isActive },
  });

  // Deactivating an account must end its live sessions, or it stays signed in
  // until the cookie expires.
  if (target.isActive) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  revalidatePath("/admin");
}
