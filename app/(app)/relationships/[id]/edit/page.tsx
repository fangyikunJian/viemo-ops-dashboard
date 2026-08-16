import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getRelationship, getRelationshipFormOptions } from "@/lib/brm/queries";
import { PageHeader } from "@/components/ui/empty-state";
import { RelationshipForm } from "@/components/brm/relationship-form";

export const metadata: Metadata = { title: "Edit relationship" };

export default async function EditRelationshipPage({
  params,
}: PageProps<"/relationships/[id]/edit">) {
  await requirePermission("edit", "relationship");

  const { id } = await params;
  const [relationship, options] = await Promise.all([
    getRelationship(id),
    getRelationshipFormOptions(),
  ]);

  if (!relationship) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={`Edit ${relationship.name}`} />
      <RelationshipForm
        values={{
          id: relationship.id,
          name: relationship.name,
          type: relationship.type,
          status: relationship.status,
          cadenceDays: relationship.cadenceDays,
          ownerId: relationship.ownerId,
          organisationId: relationship.organisationId,
          valueToUs: relationship.valueToUs,
          valueToThem: relationship.valueToThem,
          notes: relationship.notes,
          tags: relationship.tags.map((tag) => tag.label),
        }}
        teamMembers={options.teamMembers}
        organisations={options.organisations}
      />
    </div>
  );
}
