import type { Metadata } from "next";
import { Check, Plug, ScrollText, ShieldCheck, X } from "lucide-react";

import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  can,
  describePermissions,
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
} from "@/lib/auth/permissions";
import { setUserRoleAction, toggleUserActiveAction } from "@/lib/admin/actions";
import { USER_ROLES, USER_ROLE_TERMS } from "@/lib/domain/enums";
import { formatDate } from "@/lib/format";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/empty-state";
import { UserRoleBadge } from "@/components/domain/badges";
import { CreateUserForm } from "@/components/admin/create-user-form";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
  const actor = await requirePermission("manage", "user");

  const [users, teamMembers] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { teamMember: { select: { name: true } } },
    }),
    prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, user: { select: { id: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        description="Accounts and what each role may do. Every rule shown here is enforced on the server, inside the action that performs the change — hiding a control is only a courtesy."
        action={
          <div className="flex items-center gap-2">
            <ButtonLink href="/admin/audit" size="sm">
              <ScrollText className="size-3.5" aria-hidden="true" />
              Audit trail
            </ButtonLink>
            <ButtonLink href="/admin/integrations" size="sm">
              <Plug className="size-3.5" aria-hidden="true" />
              Integrations
            </ButtonLink>
          </div>
        }
      />

      <CreateUserForm
        teamMembers={teamMembers.map((member) => ({
          id: member.id,
          name: member.name,
          hasAccount: member.user !== null,
        }))}
      />

      {/* ── Accounts ───────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Accounts"
          description={`${users.filter((u) => u.isActive).length} active of ${users.length}.`}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-muted">
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">Acts as</th>
                  <th className="px-5 py-2.5 font-medium">Role</th>
                  <th className="px-5 py-2.5 font-medium">Added</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user.id} className={user.isActive ? "" : "opacity-60"}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{user.name}</p>
                      <p className="text-xs text-ink-muted">{user.email}</p>
                    </td>
                    <td className="px-5 py-3 text-ink-secondary">
                      {user.teamMember?.name ?? (
                        <span className="text-xs text-ink-muted italic">
                          Not linked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <form action={setUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded-lg border border-hairline bg-surface px-2 py-1 text-xs text-ink"
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {USER_ROLE_TERMS[role].label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-hairline px-2 py-1 text-xs text-ink-secondary hover:bg-sunken hover:text-ink"
                        >
                          Set
                        </button>
                      </form>
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-muted">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      {user.id === actor.id ? (
                        <span className="text-xs text-ink-muted">You</span>
                      ) : (
                        <form action={toggleUserActiveAction}>
                          <input type="hidden" name="id" value={user.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-hairline px-2 py-1 text-xs text-ink-secondary hover:bg-sunken hover:text-ink"
                          >
                            {user.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* ── What each role may do ──────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {USER_ROLES.map((role) => (
          <Card key={role}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <UserRoleBadge role={role} />
                </span>
              }
              description={USER_ROLE_TERMS[role].description}
            />
            <CardBody>
              <ul className="space-y-1.5">
                {describePermissions(role).map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2 text-xs text-ink-secondary"
                  >
                    <Check
                      className="mt-0.5 size-3 shrink-0 text-good"
                      aria-hidden="true"
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ── The full matrix ────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Permission matrix"
          description="Generated from lib/auth/permissions.ts, so this table and the code cannot disagree."
          action={
            <ShieldCheck className="size-4 text-ink-muted" aria-hidden="true" />
          }
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-xs">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="px-5 py-2.5 font-medium">Resource</th>
                  {PERMISSION_ACTIONS.map((action) => (
                    <th
                      key={action}
                      className="px-3 py-2.5 text-center font-medium capitalize"
                    >
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PERMISSION_RESOURCES.map((resource) => (
                  <tr key={resource}>
                    <td className="px-5 py-2 font-medium text-ink">
                      {resource}
                    </td>
                    {PERMISSION_ACTIONS.map((action) => (
                      <td key={action} className="px-3 py-2 text-center">
                        <span className="inline-flex flex-wrap justify-center gap-1">
                          {USER_ROLES.filter((role) =>
                            can(role, action, resource),
                          ).map((role) => (
                            <span
                              key={role}
                              title={`${USER_ROLE_TERMS[role].label} may ${action} a ${resource}`}
                              className="rounded bg-sunken px-1 text-[10px] text-ink-secondary"
                            >
                              {role[0]}
                            </span>
                          ))}
                          {USER_ROLES.every(
                            (role) => !can(role, action, resource),
                          ) ? (
                            <X
                              className="size-3 text-ink-muted"
                              aria-label="No role"
                            />
                          ) : null}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-2.5 text-[11px] text-ink-muted">
            A = Admin · M = Member · V = Viewer
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
