import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { getProjectFormOptions } from "@/lib/pm/queries";
import { toDateInputValue } from "@/lib/format";
import { PageHeader } from "@/components/ui/empty-state";
import { ProjectForm } from "@/components/pm/project-form";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requirePermission("create", "project");
  const { teamMembers, relationships } = await getProjectFormOptions();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="New project"
        description="Projects are the organising unit — tasks belong to a project, and a project can belong to a relationship."
      />
      <ProjectForm
        values={{
          name: "",
          description: null,
          status: "PLANNING",
          startDate: toDateInputValue(new Date()),
          dueDate: "",
          leadId: teamMembers[0]?.id ?? "",
          relationshipId: null,
          tags: [],
        }}
        teamMembers={teamMembers}
        relationships={relationships}
      />
    </div>
  );
}
