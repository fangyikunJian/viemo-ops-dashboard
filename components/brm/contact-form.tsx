"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { saveContactAction } from "@/lib/brm/actions";
import { IDLE, type ActionState } from "@/lib/form-state";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/form";

export function AddContactForm({ relationshipId }: { relationshipId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveContactAction,
    IDLE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the fields after a success, but leave the panel open: an
  // organisation usually has several people worth recording, and closing it
  // would make adding the second one take three clicks instead of none.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Add contact
      </Button>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-hairline bg-sunken p-3"
    >
      <input type="hidden" name="relationshipId" value={relationshipId} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink">New contact</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded p-0.5 text-ink-muted hover:text-ink"
          aria-label="Cancel"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <FormError message={state.error} />
      {state.ok ? (
        <p className="text-xs text-good">Contact added.</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="contact-name" required error={errors.name}>
          <Input id="contact-name" name="name" required maxLength={120} />
        </Field>
        <Field label="Role" htmlFor="contact-role" error={errors.role}>
          <Input
            id="contact-role"
            name="role"
            maxLength={120}
            placeholder="Partner"
          />
        </Field>
        <Field label="Email" htmlFor="contact-email" error={errors.email}>
          <Input id="contact-email" name="email" type="email" />
        </Field>
        <Field label="Phone" htmlFor="contact-phone" error={errors.phone}>
          <Input id="contact-phone" name="phone" maxLength={40} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-xs text-ink-secondary">
        <input
          type="checkbox"
          name="isPrimary"
          className="size-3.5 accent-[var(--accent)]"
        />
        Primary contact for this relationship
      </label>

      <Button type="submit" size="sm" variant="primary" disabled={pending}>
        {pending ? "Adding…" : "Add contact"}
      </Button>
    </form>
  );
}
