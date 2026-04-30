"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EducationInputSchema, type EducationInput } from "@/lib/validations/seeker.schema";
import { seekerService } from "@/services/seeker.service";
import type { EducationItem } from "@/services/seeker.service";
import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";

/** Degree options displayed in the degree select dropdown. */
const DEGREE_OPTIONS = [
  "High School Diploma",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctoral Degree",
  "Certificate",
  "Bootcamp",
  "Other",
] as const;

interface EducationFormProps {
  initialValues?: EducationInput;
  onSave: (data: EducationInput) => void;
  onCancel: () => void;
  isSaving: boolean;
}

/**
 * Inline form for adding or editing a single education entry.
 * Validates using EducationInputSchema via React Hook Form + Zod.
 */
function EducationForm({ initialValues, onSave, onCancel, isSaving }: EducationFormProps) {
  const form = useForm<EducationInput>({
    resolver: zodResolver(EducationInputSchema),
    defaultValues: initialValues ?? {
      institution: "",
      graduationDate: null,
      degree: null,
      major: null,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSave)}
      className="space-y-4 rounded-xl border border-slate-200 p-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Institution</label>
          <Input
            {...form.register("institution")}
            placeholder="MIT"
            aria-invalid={!!form.formState.errors.institution}
          />
          {form.formState.errors.institution && (
            <p className="text-xs text-red-500">{form.formState.errors.institution.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Degree</label>
          <Select
            value={form.watch("degree") ?? ""}
            onValueChange={(val) => form.setValue("degree", val || null)}
          >
            <SelectTrigger className="rounded-lg" aria-label="Degree type">
              <SelectValue placeholder="Select degree" />
            </SelectTrigger>
            <SelectContent>
              {DEGREE_OPTIONS.map((deg) => (
                <SelectItem key={deg} value={deg}>
                  {deg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Major / Field of Study</label>
          <Input {...form.register("major")} placeholder="Computer Science" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Graduation Date (MM/YYYY)
          </label>
          <Input {...form.register("graduationDate")} placeholder="05/2020" />
          {form.formState.errors.graduationDate && (
            <p className="text-xs text-red-500">
              {form.formState.errors.graduationDate.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isSaving}
          loadingText="Saving..."
        >
          Save
        </Button>
      </div>
    </form>
  );
}

/**
 * EducationSection renders the education entries for the seeker's settings page.
 * Supports adding, editing, and removing education items with optimistic local state
 * and persists changes via seekerService.updateSettings.
 */
export function EducationSection() {
  const queryClient = useQueryClient();
  const { data: settingsData, isLoading } = useSeekerSettingsData();
  const profile = settingsData?.data;

  const [entries, setEntries] = useState<EducationItem[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(profile?.educations ?? []);
  }, [profile?.educations]);

  const saveMutation = useMutation({
    mutationFn: (updatedEntries: EducationItem[]) =>
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
        educations: updatedEntries.map(({ id: _id, ...rest }) => rest),
      }),
    onSuccess: () => {
      toast.success("Education updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
      setAddingNew(false);
      setEditingId(null);
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  /** Normalises an EducationInput (with optional fields) into an EducationItem shape. */
  const toEducationItem = (id: string, data: EducationInput): EducationItem => ({
    id,
    institution: data.institution,
    graduationDate: data.graduationDate ?? null,
    degree: data.degree ?? null,
    major: data.major ?? null,
  });

  /** Appends a new education entry and triggers a save. */
  const handleAdd = (data: EducationInput): void => {
    const newEntries: EducationItem[] = [
      ...entries,
      toEducationItem(`temp-${Date.now()}`, data),
    ];
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  /** Updates an existing education entry by id and triggers a save. */
  const handleEdit = (id: string, data: EducationInput): void => {
    const newEntries = entries.map((e) => (e.id === id ? { ...e, ...data } : e));
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  /** Removes an education entry by id and triggers a save. */
  const handleRemove = (id: string): void => {
    const newEntries = entries.filter((e) => e.id !== id);
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  return (
    <section id="education" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Education</h3>
          <p className="text-sm text-slate-500">Share your academic background.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setAddingNew(true);
            setEditingId(null);
          }}
          disabled={isLoading || !profile || addingNew}
          aria-label="Add education"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      <div className="space-y-4 p-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            {entries.map((entry) => (
              <div key={entry.id}>
                {editingId === entry.id ? (
                  <EducationForm
                    initialValues={{
                      institution: entry.institution,
                      graduationDate: entry.graduationDate,
                      degree: entry.degree,
                      major: entry.major,
                    }}
                    onSave={(data) => handleEdit(entry.id, data)}
                    onCancel={() => setEditingId(null)}
                    isSaving={saveMutation.isPending}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.degree ? `${entry.degree} · ` : ""}
                        {entry.institution}
                      </p>
                      {entry.major && (
                        <p className="text-xs text-slate-500">{entry.major}</p>
                      )}
                      {entry.graduationDate && (
                        <p className="text-xs text-slate-500">
                          Graduated {entry.graduationDate}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(entry.id);
                          setAddingNew(false);
                        }}
                        aria-label={`Edit ${entry.institution}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(entry.id)}
                        disabled={saveMutation.isPending}
                        aria-label={`Remove ${entry.institution}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
                <Separator className="mt-4" />
              </div>
            ))}

            {entries.length === 0 && !addingNew && (
              <p className="text-sm text-slate-500">No education added yet.</p>
            )}

            {addingNew && (
              <EducationForm
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
