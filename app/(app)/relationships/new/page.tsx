import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { getRelationshipFormOptions } from "@/lib/brm/queries";
import { PageHeader } from "@/components/ui/empty-state";
import { RelationshipForm } from "@/components/brm/relationship-form";

export const metadata: Metadata = { title: "New relationship" };

export default async function NewRelationshipPage() {
  await requirePermission("create", "relationship");
  const { teamMembers, organisations } = await getRelationshipFormOptions();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="New relationship"
        description="Anyone the studio's success depends on — not only the people who pay it."
      />
      <RelationshipForm
        values={{
          name: "",
          type: "ADVISOR",
          status: "PROSPECTIVE",
          cadenceDays: 90,
          ownerId: teamMembers[0]?.id ?? "",
          organisationId: null,
          valueToUs: null,
          valueToThem: null,
          notes: null,
          tags: [],
        }}
        teamMembers={teamMembers}
        organisations={organisations}
      />
    </div>
  );
}
