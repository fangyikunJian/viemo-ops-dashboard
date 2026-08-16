"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { saveTaskAction } from "@/lib/pm/actions";
import { IDLE, type ActionState } from "@/lib/form-state";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_TERMS,
  TASK_STATUSES,
  TASK_STATUS_TERMS,
} from "@/lib/domain/enums";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/form";

export function AddTaskForm({
  projectId,
  teamMembers,
}: {
  projectId: string;
  teamMembers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveTaskAction,
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
        Add task
      </Button>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-hairline bg-surface p-4"
    >
      <input type="hidden" name="projectId" value={projectId} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">New task</p>
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

      <Field label="Title" htmlFor="task-title" required error={errors.title}>
        <Input id="task-title" name="title" required maxLength={200} />
      </Field>

      <Field label="Detail" htmlFor="task-description">
        <Textarea
          id="task-description"
          name="description"
          maxLength={2000}
          className="min-h-16"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Status" htmlFor="task-status" required>
          <Select id="task-status" name="status" defaultValue="TODO" required>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_TERMS[status].label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Priority" htmlFor="task-priority" required>
          <Select
            id="task-priority"
            name="priority"
            defaultValue="MEDIUM"
            required
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY_TERMS[priority].label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Assignee" htmlFor="task-assignee">
          <Select id="task-assignee" name="assigneeId" defaultValue="">
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Due" htmlFor="task-due" error={errors.dueDate}>
          <Input id="task-due" name="dueDate" type="date" />
        </Field>
      </div>

      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}
