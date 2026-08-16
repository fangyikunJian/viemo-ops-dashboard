"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";

import { saveProjectAction } from "@/lib/pm/actions";
import { IDLE, type ActionState } from "@/lib/form-state";
import { PROJECT_STATUSES, PROJECT_STATUS_TERMS } from "@/lib/domain/enums";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export type ProjectFormValues = {
  id?: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  dueDate: string;
  leadId: string;
  relationshipId: string | null;
  tags: string[];
};

export function ProjectForm({
  values,
  teamMembers,
  relationships,
}: {
  values: ProjectFormValues;
  teamMembers: { id: string; name: string }[];
  relationships: { id: string; name: string; type: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveProjectAction,
    IDLE,
  );

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <FormError message={state.error} />

      <Card>
        <CardHeader title="The project" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            htmlFor="name"
            required
            error={errors.name}
            className="sm:col-span-2"
          >
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              required
              maxLength={160}
              placeholder="Brightpath Scheduling — v1"
            />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            className="sm:col-span-2"
            hint="What it is and why it matters, in a sentence or two."
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={values.description ?? ""}
              maxLength={4000}
            />
          </Field>

          <Field label="Status" htmlFor="status" required error={errors.status}>
            <Select id="status" name="status" defaultValue={values.status} required>
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_TERMS[status].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Lead" htmlFor="leadId" required error={errors.leadId}>
            <Select id="leadId" name="leadId" defaultValue={values.leadId} required>
              <option value="">Choose someone…</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Start date" htmlFor="startDate" error={errors.startDate}>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={values.startDate}
            />
          </Field>

          <Field label="Due date" htmlFor="dueDate" error={errors.dueDate}>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={values.dueDate}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Who it is for"
          description="Linking a project to a relationship is what lets the dashboard show relationship health and project status as one picture. It is optional — internal work has no counterpart."
        />
        <CardBody className="space-y-4">
          <Field label="Relationship" htmlFor="relationshipId">
            <Select
              id="relationshipId"
              name="relationshipId"
              defaultValue={values.relationshipId ?? ""}
            >
              <option value="">Internal — not for a specific relationship</option>
              {relationships.map((relationship) => (
                <option key={relationship.id} value={relationship.id}>
                  {relationship.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Tags"
            htmlFor="tags"
            hint="Comma separated, shared with relationships."
          >
            <Input
              id="tags"
              name="tags"
              defaultValue={values.tags.join(", ")}
              placeholder="health, paying"
            />
          </Field>
        </CardBody>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          <Save className="size-4" aria-hidden="true" />
          {pending ? "Saving…" : values.id ? "Save changes" : "Create project"}
        </Button>
        <Link
          href={values.id ? `/projects/${values.id}` : "/projects"}
          className="text-sm text-ink-secondary hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
