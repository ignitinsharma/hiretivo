"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkillsTagInput } from "@/components/forms/skills-tag-input";

import { ProjectInputSchema, type ProjectInput } from "@/lib/validations/project.schema";
import { seekerService } from "@/services/seeker.service";

type ProjectFormValues = z.input<typeof ProjectInputSchema>;

interface ProjectFormProps {
  initialValues?: ProjectFormValues;
  onSave: (data: ProjectInput) => void;
  onCancel: () => void;
  isSaving: boolean;
}

/*
 * ProjectForm
 * Inline add/edit form for one project entry.
 */
function ProjectForm({ initialValues, onSave, onCancel, isSaving }: ProjectFormProps) {
  const form = useForm<ProjectFormValues, unknown, ProjectInput>({
    resolver: zodResolver(ProjectInputSchema),
    defaultValues: initialValues ?? { title: "", description: "", url: "", skills: [] },
  });

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 rounded-xl border border-brand-border p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-brand-foreground">Title</label>
          <Input {...form.register("title")} placeholder="Job board scraper" aria-invalid={!!form.formState.errors.title} />
          {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-brand-foreground">URL</label>
          <Input {...form.register("url")} placeholder="https://github.com/you/project" aria-invalid={!!form.formState.errors.url} />
          {form.formState.errors.url && <p className="text-xs text-red-500">{form.formState.errors.url.message}</p>}
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-brand-foreground">Description</label>
          <Textarea {...form.register("description")} rows={3} placeholder="What did you build?" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-brand-foreground">Skills Used</label>
          <SkillsTagInput
            value={(form.watch("skills") as string[] | undefined) ?? []}
            onChange={(skills) => form.setValue("skills", skills)}
            disabled={false}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="default" size="sm" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button type="submit" variant="primary" size="sm" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

/*
 * ProjectsSection
 * Seeker settings panel for managing portfolio projects, stored on
 * SeekerProfile.topProjects Json (no dedicated Project model shipped).
 * Full-replace list editor mirroring CertificationsSection.
 */
export function ProjectsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<{ data: { projects: ProjectInput[] } }>({
    queryKey: ["seeker-projects"],
    queryFn: seekerService.getProjects,
    staleTime: 60_000,
  });
  const items = data?.data.projects ?? [];

  const [entries, setEntries] = useState<ProjectInput[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setEntries(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (updated: ProjectInput[]) => seekerService.updateProjects(updated),
    onSuccess: () => {
      toast.success("Projects updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-projects"] });
      setAddingNew(false);
      setEditingIndex(null);
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  const handleAdd = (data: ProjectInput): void => {
    const newEntries = [...entries, data];
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  const handleEdit = (index: number, data: ProjectInput): void => {
    const newEntries = entries.map((e, i) => (i === index ? data : e));
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  const handleRemove = (index: number): void => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  return (
    <section id="projects" className="rounded-xl border border-brand-border bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-brand-border p-6">
        <div>
          <h3 className="text-lg font-bold text-brand-foreground">Projects</h3>
          <p className="text-sm text-brand-foreground-muted">Showcase side projects and portfolio work.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setAddingNew(true); setEditingIndex(null); }}
          disabled={isLoading || addingNew}
          aria-label="Add project"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      <div className="space-y-4 p-6">
        {isError && <p className="text-sm text-red-500">Failed to load projects.</p>}
        {isLoading ? (
          <p className="text-sm text-brand-foreground-muted">Loading...</p>
        ) : (
          <>
            {entries.map((entry, index) => (
              <div key={`${entry.title}-${index}`}>
                {editingIndex === index ? (
                  <ProjectForm
                    initialValues={entry}
                    onSave={(data) => handleEdit(index, data)}
                    onCancel={() => setEditingIndex(null)}
                    isSaving={saveMutation.isPending}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2 rounded-xl border border-brand-border p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-brand-foreground">{entry.title}</p>
                      {entry.description && <p className="text-sm text-brand-foreground-muted">{entry.description}</p>}
                      {entry.skills.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {entry.skills.map((skill) => (
                            <span key={skill} className="rounded-lg bg-brand-surface px-2 py-0.5 text-xs text-brand-foreground-muted">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => { setEditingIndex(index); setAddingNew(false); }} aria-label={`Edit ${entry.title}`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)} disabled={saveMutation.isPending} aria-label={`Remove ${entry.title}`}>
                        <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {entries.length === 0 && !addingNew && (
              <p className="text-sm text-brand-foreground-muted">No projects added yet.</p>
            )}

            {addingNew && (
              <ProjectForm onSave={handleAdd} onCancel={() => setAddingNew(false)} isSaving={saveMutation.isPending} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
