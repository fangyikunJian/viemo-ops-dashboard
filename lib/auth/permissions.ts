/**
 * Role-based access control.
 *
 * Deliberately kept as one pure function over a small table rather than spread
 * through the modules it protects. Two consequences worth having:
 *
 *   - the whole policy can be read in one screen, and tested without a database
 *   - lib/brm and lib/pm contain no permission logic at all, so the access layer
 *     can be changed, tightened or removed without touching either module
 *
 * Enforcement happens at two points: `requirePermission` inside every server
 * action that writes, and route guards that decide what a role may open. The
 * UI additionally hides controls a role cannot use, but that is a courtesy —
 * the server action is the boundary that actually holds.
 */

import type { UserRole } from "@/lib/domain/enums";

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "archive",
  "delete",
  "manage",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_RESOURCES = [
  "relationship",
  "contact",
  "interaction",
  "project",
  "task",
  "organisation",
  "tag",
  "teamMember",
  "user",
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];

/**
 * What each role may do to an ordinary record.
 *
 * The meaningful line is between `archive` and `delete`. Archiving is
 * reversible and keeps the history, so members may do it; deletion destroys
 * context that a future team member would have wanted, so it is reserved.
 */
const ROLE_ACTIONS: Record<UserRole, readonly PermissionAction[]> = {
  VIEWER: ["view"],
  MEMBER: ["view", "create", "edit", "archive"],
  ADMIN: ["view", "create", "edit", "archive", "delete", "manage"],
};

/** Resources no non-administrator may touch in any way, including reading. */
const ADMIN_ONLY_RESOURCES: readonly PermissionResource[] = ["user"];

/** May a role take this action on this kind of record? */
export function can(
  role: UserRole,
  action: PermissionAction,
  resource: PermissionResource,
): boolean {
  const allowed = ROLE_ACTIONS[role];
  // An unrecognised role fails closed rather than falling through to a default.
  if (!allowed) return false;

  if (ADMIN_ONLY_RESOURCES.includes(resource)) return role === "ADMIN";

  return allowed.includes(action);
}

export class PermissionError extends Error {
  readonly role: UserRole;
  readonly action: PermissionAction;
  readonly resource: PermissionResource;

  constructor(
    role: UserRole,
    action: PermissionAction,
    resource: PermissionResource,
  ) {
    super(`A ${role.toLowerCase()} may not ${action} a ${resource}.`);
    this.name = "PermissionError";
    this.role = role;
    this.action = action;
    this.resource = resource;
  }
}

/** Throw unless the role is allowed. Called at the top of every write. */
export function requirePermission(
  role: UserRole,
  action: PermissionAction,
  resource: PermissionResource,
): void {
  if (!can(role, action, resource)) {
    throw new PermissionError(role, action, resource);
  }
}

/** Whether a role can change anything at all — used to hide edit affordances. */
export function isReadOnly(role: UserRole): boolean {
  return !can(role, "edit", "relationship");
}

/**
 * Plain-English summary of a role's rights, shown on the admin screen and
 * reproduced in the user guide so the two cannot disagree.
 */
export function describePermissions(role: UserRole): string[] {
  const lines = [
    "Read the dashboard, all relationships and all projects",
  ];

  if (can(role, "create", "relationship")) {
    lines.push("Create and edit relationships, contacts and interactions");
    lines.push("Create and edit projects and tasks");
  }
  if (can(role, "archive", "relationship")) {
    lines.push("Archive relationships and close out projects");
  }
  if (can(role, "delete", "relationship")) {
    lines.push("Permanently delete records");
  }
  if (can(role, "manage", "user")) {
    lines.push("Create user accounts and assign roles");
  }

  return lines;
}
