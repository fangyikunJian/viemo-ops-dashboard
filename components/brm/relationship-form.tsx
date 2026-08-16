"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";

import { saveRelationshipAction } from "@/lib/brm/actions";
import { IDLE, type ActionState } from "@/lib/form-state";
import {
  CADENCE_PRESETS,
  RELATIONSHIP_STATUSES,
  RELATIONSHIP_STATUS_TERMS,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_TYPE_TERMS,
} from "@/lib/domain/enums";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export type RelationshipFormValues = {
  id?: string;
  name: string;
  type: string;
  status: string;
  cadenceDays: number | null;
  ownerId: string;
  organisationId: string | null;
  valueToUs: string | null;
  valueToThem: string | null;
  notes: string | null;
  tags: string[];
};

export function RelationshipForm({
  values,
  teamMembers,
  organisations,
}: {
  values: RelationshipFormValues;
  teamMembers: { id: string; name: string }[];
  organisations: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveRelationshipAction,
    IDLE,
  );

  // Cadence is a preset or a custom number of days; the toggle only affects
  // which control is shown, so the submitted field name stays the same.
  const isPreset =
    values.cadenceDays === null ||
    CADENCE_PRESETS.some((preset) => preset.days === values.cadenceDays);
  const [custom, setCustom] = useState(!isPreset);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <FormError message={state.error} />

      <Card>
        <CardHeader title="Who this is" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            htmlFor="name"
            required
            error={errors.name}
            className="sm:col-span-2"
            hint="A person or an entity — whichever the relationship actually is."
          >
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              required
              maxLength={120}
              placeholder="Dr Sarah Chen, or Lumen Ventures"
            />
          </Field>

          <Field label="Type" htmlFor="type" required error={errors.type}>
            <Select id="type" name="type" defaultValue={values.type} required>
              {RELATIONSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RELATIONSHIP_TYPE_TERMS[type].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Status" htmlFor="status" required error={errors.status}>
            <Select
              id="status"
              name="status"
              defaultValue={values.status}
              required
            >
              {RELATIONSHIP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {RELATIONSHIP_STATUS_TERMS[status].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Owner" htmlFor="ownerId" required error={errors.ownerId}>
            <Select
              id="ownerId"
              name="ownerId"
              defaultValue={values.ownerId}
              required
            >
              <option value="">Choose someone…</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Organisation"
            htmlFor="organisationId"
            hint="Optional. Leave blank for an individual."
          >
            <Select
              id="organisationId"
              name="organisationId"
              defaultValue={values.organisationId ?? ""}
            >
              <option value="">None</option>
              {organisations.map((organisation) => (
                <option key={organisation.id} value={organisation.id}>
                  {organisation.name}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Contact rhythm"
          description="How often this relationship should be maintained. The dashboard measures every relationship against its own cadence rather than against a shared rule."
        />
        <CardBody className="space-y-4">
          {custom ? (
            <Field
              label="Cadence, in days"
              htmlFor="cadenceDays"
              error={errors.cadenceDays}
              hint="Leave blank if this relationship should not be tracked to a rhythm."
            >
              <Input
                id="cadenceDays"
                name="cadenceDays"
                type="number"
                min={1}
                max={3650}
                defaultValue={values.cadenceDays ?? ""}
                className="max-w-40"
              />
            </Field>
          ) : (
            <Field
              label="Cadence"
              htmlFor="cadenceDays"
              error={errors.cadenceDays}
              hint="Not tracked is a deliberate choice, and reads differently from overdue."
            >
              <Select
                id="cadenceDays"
                name="cadenceDays"
                defaultValue={values.cadenceDays ?? ""}
                className="max-w-56"
              >
                <option value="">Not tracked</option>
                {CADENCE_PRESETS.map((preset) => (
                  <option key={preset.days} value={preset.days}>
                    {preset.label} — every {preset.days} days
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <button
            type="button"
            onClick={() => setCustom((value) => !value)}
            className="text-xs font-medium text-accent hover:underline"
          >
            {custom ? "Use a preset instead" : "Set a custom number of days"}
          </button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Value, both ways"
          description="What each side gets. A CRM records what a customer is worth; a relationship is worth describing in both directions, and the second direction is the one teams forget."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="What they give us" htmlFor="valueToUs">
            <Textarea
              id="valueToUs"
              name="valueToUs"
              defaultValue={values.valueToUs ?? ""}
              maxLength={600}
              placeholder="Clinical validation and health-sector introductions"
            />
          </Field>
          <Field label="What we give them" htmlFor="valueToThem">
            <Textarea
              id="valueToThem"
              name="valueToThem"
              defaultValue={values.valueToThem ?? ""}
              maxLength={600}
              placeholder="Early sight of health ventures; advisory equity"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Anything else" />
        <CardBody className="space-y-4">
          <Field
            label="Tags"
            htmlFor="tags"
            hint="Comma separated. Shared with projects, so the same label means the same thing in both modules."
          >
            <Input
              id="tags"
              name="tags"
              defaultValue={values.tags.join(", ")}
              placeholder="health, advisory-board"
            />
          </Field>

          <Field
            label="Notes"
            htmlFor="notes"
            hint="Context a colleague would need before picking this relationship up."
          >
            <Textarea
              id="notes"
              name="notes"
              defaultValue={values.notes ?? ""}
              maxLength={4000}
              className="min-h-28"
            />
          </Field>
        </CardBody>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          <Save className="size-4" aria-hidden="true" />
          {pending ? "Saving…" : values.id ? "Save changes" : "Create relationship"}
        </Button>
        <Link
          href={values.id ? `/relationships/${values.id}` : "/relationships"}
          className="text-sm text-ink-secondary hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
