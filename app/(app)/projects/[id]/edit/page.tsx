import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getProject, getProjectFormOptions } from "@/lib/pm/queries";
import { toDateInputValue } from "@/lib/format";
import { PageHeader } from "@/components/ui/empty-state";
import { ProjectForm } from "@/components/pm/project-form";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: PageProps<"/projects/[id]/edit">) {
  await requirePermission("edit", "project");

  const { id } = await params;
  const [project, options] = await Promise.all([
    getProject(id),
    getProjectFormOptions(),
  ]);

  if (!project) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={`Edit ${project.name}`} />
      <ProjectForm
        values={{
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          startDate: toDateInputValue(project.startDate),
          dueDate: toDateInputValue(project.dueDate),
          leadId: project.leadId,
          relationshipId: project.relationshipId,
          tags: project.tags.map((tag) => tag.label),
        }}
        teamMembers={options.teamMembers}
        relationships={options.relationships}
      />
    </div>
  );
}
