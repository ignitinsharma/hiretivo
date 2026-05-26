"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SeekerProjectInputSchema,
  type SeekerProjectInput,
} from "@/lib/validations/seeker.schema";
import { seekerService, type SeekerProjectItem } from "@/services/seeker.service";
import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";

function emptyProject(): SeekerProjectItem {
  return { name: "", description: "", sourceUrl: "", liveUrl: null };
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

interface ProjectFormProps {
  initialValues?: SeekerProjectItem;
  onSave: (data: SeekerProjectInput) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function ProjectForm({ initialValues, onSave, onCancel, isSaving }: ProjectFormProps) {
  const form = useForm<SeekerProjectInput>({
    resolver: zodResolver(SeekerProjectInputSchema),
    defaultValues: initialValues ?? {
      name: "",
      description: "",
      sourceUrl: "",
      liveUrl: null,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSave)}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="grid gap-3">
        <div>
          <Input
            {...form.register("name")}
            placeholder="Project name"
            aria-invalid={!!form.formState.errors.name}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-brand-danger">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <Textarea
            {...form.register("description")}
            rows={3}
            placeholder="What did you build? What was your contribution?"
            aria-invalid={!!form.formState.errors.description}
          />
          {form.formState.errors.description && (
            <p className="mt-1 text-xs text-brand-danger">{form.formState.errors.description.message}</p>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Input
              {...form.register("sourceUrl")}
              placeholder="https://github.com/user/repo"
              aria-invalid={!!form.formState.errors.sourceUrl}
            />
            {form.formState.errors.sourceUrl && (
              <p className="mt-1 text-xs text-brand-danger">{form.formState.errors.sourceUrl.message}</p>
            )}
          </div>
          <div>
            <Input
              {...form.register("liveUrl")}
              placeholder="https://demo.example.com (optional)"
              aria-invalid={!!form.formState.errors.liveUrl}
            />
            {form.formState.errors.liveUrl && (
              <p className="mt-1 text-xs text-brand-danger">{form.formState.errors.liveUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="default" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={isSaving} loadingText="Saving...">
          Save
        </Button>
      </div>
    </form>
  );
}

export function ProjectsSection() {
  const queryClient = useQueryClient();
  const { data: settingsData, isLoading } = useSeekerSettingsData();
  const profile = settingsData?.data;

  const [projects, setProjects] = useState<SeekerProjectItem[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setProjects(profile?.topProjects?.length ? profile.topProjects : []);
  }, [profile?.topProjects]);

  const saveMutation = useMutation({
    mutationFn: (nextProjects: SeekerProjectItem[]) =>
      seekerService.updateSettings({
        name: profile?.name ?? "",
        headline: profile?.headline ?? "",
        bio: profile?.bio ?? "",
        location: profile?.location ?? "",
        situation: profile?.situation ?? "",
        primaryRole: profile?.primaryRole ?? "",
        salaryMin: profile?.salaryMin ?? null,
        salaryMax: profile?.salaryMax ?? null,
        currency: profile?.currency ?? "",
        availability: profile?.availability ?? "",
        yearsExperience: profile?.yearsExperience ?? null,
        topProjects: nextProjects,
      }),
    onSuccess: () => {
      toast.success("Projects updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
      setAddingNew(false);
      setEditingIndex(null);
    },
    onError: () => toast.error("Failed to save projects. Try again."),
  });

  const handleAdd = (data: SeekerProjectInput): void => {
    const newEntry: SeekerProjectItem = {
      name: data.name,
      description: data.description,
      sourceUrl: data.sourceUrl,
      liveUrl: data.liveUrl?.trim() || null,
    };
    const next = [...projects, newEntry];
    setProjects(next);
    saveMutation.mutate(next);
  };

  const handleEdit = (index: number, data: SeekerProjectInput): void => {
    const next = projects.map((p, i) =>
      i === index
        ? { ...p, name: data.name, description: data.description, sourceUrl: data.sourceUrl, liveUrl: data.liveUrl?.trim() || null }
        : p,
    );
    setProjects(next);
    saveMutation.mutate(next);
  };

  const handleRemove = (index: number): void => {
    const next = projects.filter((_, i) => i !== index);
    setProjects(next);
    saveMutation.mutate(next);
  };

  return (
    <section id="projects" className="rounded-xl border border-brand-border bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-brand-border p-6">
        <div>
          <h3 className="text-lg font-bold text-brand-foreground">Projects</h3>
          <p className="text-sm text-brand-foreground-muted">
            Add one to three practical projects for verification review.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading || !profile || addingNew || projects.length >= 3}
          onClick={() => {
            setAddingNew(true);
            setEditingIndex(null);
          }}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-4 p-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            {projects.map((project, index) => (
              <div key={index}>
                {editingIndex === index ? (
                  <ProjectForm
                    initialValues={project}
                    onSave={(data) => handleEdit(index, data)}
                    onCancel={() => setEditingIndex(null)}
                    isSaving={saveMutation.isPending}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-white p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                      <p className="line-clamp-2 text-sm text-slate-500">{project.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="truncate">{project.sourceUrl}</span>
                        {project.liveUrl ? <span className="truncate">{project.liveUrl}</span> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingIndex(index);
                          setAddingNew(false);
                        }}
                        aria-label={`Edit ${project.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
                        disabled={saveMutation.isPending}
                        aria-label={`Remove ${project.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-brand-danger" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {projects.length === 0 && !addingNew && (
              <p className="text-sm text-slate-500">No projects added yet.</p>
            )}

            {addingNew && (
              <ProjectForm
                onSave={handleAdd}
                onCancel={() => setAddingNew(false)}
                isSaving={saveMutation.isPending}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
