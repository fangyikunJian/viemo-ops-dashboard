"use client";

import { useActionState, useEffect, useRef } from "react";
import { MessageSquarePlus } from "lucide-react";

import { logInteractionAction } from "@/lib/brm/actions";
import { IDLE, type ActionState } from "@/lib/form-state";
import {
  INTERACTION_CHANNELS,
  INTERACTION_CHANNEL_TERMS,
} from "@/lib/domain/enums";
import { toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/form";

export function LogInteractionForm({
  relationshipId,
  projects,
}: {
  relationshipId: string;
  projects: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    logInteractionAction,
    IDLE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful log so the next one starts empty.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="relationshipId" value={relationshipId} />
      <FormError message={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="When"
          htmlFor="occurredAt"
          required
          error={errors.occurredAt}
        >
          <Input
            id="occurredAt"
            name="occurredAt"
            type="date"
            required
            defaultValue={toDateInputValue(new Date())}
            max={toDateInputValue(new Date())}
          />
        </Field>

        <Field label="Channel" htmlFor="channel" required error={errors.channel}>
          <Select id="channel" name="channel" defaultValue="MEETING" required>
            {INTERACTION_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {INTERACTION_CHANNEL_TERMS[channel].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="What happened"
        htmlFor="summary"
        required
        error={errors.summary}
      >
        <Textarea
          id="summary"
          name="summary"
          required
          maxLength={2000}
          placeholder="Quarterly catch-up. Walked through where we are stuck and agreed two introductions."
        />
      </Field>

      {projects.length > 0 ? (
        <Field
          label="About a project"
          htmlFor="projectId"
          hint="Optional. Links this touchpoint to project work, so the dashboard can show them together."
        >
          <Select id="projectId" name="projectId" defaultValue="">
            <option value="">Not about a specific project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <label className="flex items-start gap-2.5 rounded-lg border border-hairline bg-sunken px-3 py-2.5">
        <input
          type="checkbox"
          name="isSubstantive"
          defaultChecked
          className="mt-0.5 size-4 accent-[var(--accent)]"
        />
        <span className="text-xs">
          <span className="font-medium text-ink">
            This resets the contact clock
          </span>
          <span className="mt-0.5 block text-ink-secondary">
            Leave ticked for a real conversation. Untick for a forwarded link or
            a one-line reply — contact, but not the conversation the cadence
            exists to make sure happens.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          {pending ? "Logging…" : "Log interaction"}
        </Button>
        {state.ok ? (
          <span className="text-xs text-good">Logged.</span>
        ) : null}
      </div>
    </form>
  );
}
