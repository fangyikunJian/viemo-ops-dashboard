"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { createUserAction } from "@/lib/admin/actions";
import { IDLE, type ActionState } from "@/lib/form-state";
import { USER_ROLES, USER_ROLE_TERMS } from "@/lib/domain/enums";
// Rules only — importing from lib/auth/password here would pull node:crypto
// into the browser bundle and break the page at runtime.
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-rules";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select } from "@/components/ui/form";

export function CreateUserForm({
  teamMembers,
}: {
  teamMembers: { id: string; name: string; hasAccount: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createUserAction,
    IDLE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        New account
      </Button>
    );
  }

  const errors = state.fieldErrors ?? {};
  const available = teamMembers.filter((member) => !member.hasAccount);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-xl border border-hairline bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">New account</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded p-0.5 text-ink-muted hover:text-ink"
          aria-label="Close"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <FormError message={state.error} />
      {state.ok ? (
        <p className="rounded-lg border border-good/30 bg-good-soft px-3 py-2 text-sm text-good">
          Account created.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="user-name" required error={errors.name}>
          <Input id="user-name" name="name" required maxLength={120} />
        </Field>

        <Field label="Email" htmlFor="user-email" required error={errors.email}>
          <Input id="user-email" name="email" type="email" required />
        </Field>

        <Field
          label="Password"
          htmlFor="user-password"
          required
          error={errors.password}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters. Give it to them to change on first use.`}
        >
          <Input
            id="user-password"
            name="password"
            type="text"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="off"
          />
        </Field>

        <Field label="Role" htmlFor="user-role" required error={errors.role}>
          <Select id="user-role" name="role" defaultValue="VIEWER" required>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {USER_ROLE_TERMS[role].label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Acts as"
          htmlFor="user-team-member"
          error={errors.teamMemberId}
          className="sm:col-span-2"
          hint="Which person in the studio this account is. Needed before they can log interactions."
        >
          <Select id="user-team-member" name="teamMemberId" defaultValue="">
            <option value="">Not linked</option>
            {available.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
