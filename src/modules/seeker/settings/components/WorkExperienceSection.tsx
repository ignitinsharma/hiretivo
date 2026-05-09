"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  WorkExperienceInputSchema,
  type WorkExperienceInput,
} from "@/lib/validations/seeker.schema";
import { PositionType } from "@/constants/enums";
import { seekerService } from "@/services/seeker.service";
import type { WorkExperienceItem } from "@/services/seeker.service";
import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";
import { SkillsTagInput } from "@/components/forms/skills-tag-input";

/**
 * Raw field values as entered in the form (before Zod transforms/defaults).
 * Used as the RHF TFieldValues generic so RHF and zodResolver agree on shape.
 */
type WorkExperienceFormValues = z.input<typeof WorkExperienceInputSchema>;

/** Display labels for each position type option */
const POSITION_TYPE_OPTIONS = [
  { value: PositionType.TECHNICAL, label: "Technical" },
  { value: PositionType.NON_TECHNICAL, label: "Non-Technical" },
] as const;

/**
 * Formats a start/end date range into a human-readable string.
 * Returns "MM/YYYY – Present" when isCurrent is true or endDate is absent.
 */
function formatDateRange(
  startDate: string,
  endDate: string | null,
  isCurrent: boolean,
): string {
  return `${startDate} – ${isCurrent || !endDate ? "Present" : endDate}`;
}

interface ExperienceFormProps {
  initialValues?: WorkExperienceFormValues;
  onSave: (data: WorkExperienceInput) => void;
  onCancel: () => void;
  isSaving: boolean;
}

/**
 * Inline form used for both adding a new work experience entry
 * and editing an existing one. Validates with WorkExperienceInputSchema.
 */
function ExperienceForm({
  initialValues,
  onSave,
  onCancel,
  isSaving,
}: ExperienceFormProps) {
  const form = useForm<WorkExperienceFormValues, unknown, WorkExperienceInput>({
    resolver: zodResolver(WorkExperienceInputSchema),
    defaultValues: initialValues ?? {
      company: "",
      title: "",
      startDate: "",
      endDate: null,
      isCurrent: false,
      description: null,
      positionType: null,
      skills: [],
    },
  });

  const isCurrent = form.watch("isCurrent");

  return (
    <form
      onSubmit={form.handleSubmit(onSave)}
      className="space-y-4 rounded-xl border border-slate-200 p-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Company</label>
          <Input
            {...form.register("company")}
            placeholder="Acme Inc."
            aria-invalid={!!form.formState.errors.company}
          />
          {form.formState.errors.company && (
            <p className="text-xs text-red-500">
              {form.formState.errors.company.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Title</label>
          <Input
            {...form.register("title")}
            placeholder="Senior Engineer"
            aria-invalid={!!form.formState.errors.title}
          />
          {form.formState.errors.title && (
            <p className="text-xs text-red-500">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Start Date (MM/YYYY)
          </label>
          <Input
            {...form.register("startDate")}
            placeholder="01/2022"
            aria-invalid={!!form.formState.errors.startDate}
          />
          {form.formState.errors.startDate && (
            <p className="text-xs text-red-500">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            End Date (MM/YYYY)
          </label>
          <Input
            {...form.register("endDate")}
            placeholder="12/2024"
            disabled={isCurrent ?? false}
            aria-invalid={!!form.formState.errors.endDate}
          />
          {form.formState.errors.endDate && (
            <p className="text-xs text-red-500">
              {form.formState.errors.endDate.message}
            </p>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              {...form.register("isCurrent")}
              className="h-3.5 w-3.5"
              aria-label="Currently working here"
              onChange={(e) => {
                form.setValue("isCurrent", e.target.checked);
                if (e.target.checked) {
                  form.setValue("endDate", null);
                }
              }}
            />
            Currently working here
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Position Type
          </label>
          <Select
            value={form.watch("positionType") ?? ""}
            onValueChange={(val) =>
              form.setValue(
                "positionType",
                val === "" ? null : (val as PositionType),
              )
            }
          >
            <SelectTrigger className="rounded-lg" aria-label="Position type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {POSITION_TYPE_OPTIONS.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">
            Description
          </label>
          <Textarea
            {...form.register("description")}
            rows={3}
            placeholder="What did you build or accomplish?"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">
            Skills Used
          </label>
          <SkillsTagInput
            value={(form.watch("skills") as string[] | undefined) ?? []}
            onChange={(skills) => form.setValue("skills", skills)}
            disabled={false}
          />
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
        <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Converts validated WorkExperienceInput output into a WorkExperienceItem
 * by filling in required fields that have optional types in the Zod output.
 */
function toWorkExperienceItem(
  id: string,
  data: WorkExperienceInput,
): WorkExperienceItem {
  return {
    id,
    company: data.company,
    title: data.title,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
    isCurrent: data.isCurrent,
    description: data.description ?? null,
    positionType: data.positionType ?? null,
    skills: data.skills,
  };
}

/**
 * WorkExperienceSection — seeker settings panel for managing work history.
 * Renders a list of existing experiences and allows adding, editing, and
 * removing entries. Each save sends the full updated list to the server
 * (delete-all + recreate pattern).
 */
export function WorkExperienceSection() {
  const queryClient = useQueryClient();
  const { data: settingsData, isLoading } = useSeekerSettingsData();
  const profile = settingsData?.data;

  const [entries, setEntries] = useState<WorkExperienceItem[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(profile?.workExperiences ?? []);
  }, [profile?.workExperiences]);

  const saveMutation = useMutation({
    mutationFn: (updatedEntries: WorkExperienceItem[]) =>
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
        workExperiences: updatedEntries.map(
          ({ id: _id, positionType, ...rest }) => ({
            ...rest,
            positionType: positionType as PositionType | null | undefined,
          }),
        ),
      }),
    onSuccess: () => {
      toast.success("Work experience updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
      setAddingNew(false);
      setEditingId(null);
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  const handleAdd = (data: WorkExperienceInput): void => {
    const newEntry = toWorkExperienceItem(`temp-${Date.now()}`, data);
    const newEntries: WorkExperienceItem[] = [...entries, newEntry];
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  const handleEdit = (id: string, data: WorkExperienceInput): void => {
    const newEntries = entries.map((e) =>
      e.id === id ? toWorkExperienceItem(id, data) : e,
    );
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  const handleRemove = (id: string): void => {
    const newEntries = entries.filter((e) => e.id !== id);
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  return (
    <section
      id="experience"
      className="rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Work Experience</h3>
          <p className="text-sm text-slate-500">
            Add your past roles to strengthen your profile.
          </p>
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
          aria-label="Add work experience"
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
                  <ExperienceForm
                    initialValues={{
                      company: entry.company,
                      title: entry.title,
                      startDate: entry.startDate,
                      endDate: entry.endDate,
                      isCurrent: entry.isCurrent,
                      description: entry.description,
                      positionType: entry.positionType as PositionType | null,
                      skills: entry.skills,
                    }}
                    onSave={(data) => handleEdit(entry.id, data)}
                    onCancel={() => setEditingId(null)}
                    isSaving={saveMutation.isPending}
                  />
                ) : (
                  <ExperienceCard
                    entry={entry}
                    onEdit={() => {
                      setEditingId(entry.id);
                      setAddingNew(false);
                    }}
                    onRemove={() => handleRemove(entry.id)}
                    isRemoving={saveMutation.isPending}
                  />
                )}
                <Separator className="mt-4" />
              </div>
            ))}

            {entries.length === 0 && !addingNew && (
              <p className="text-sm text-slate-500">
                No work experience added yet.
              </p>
            )}

            {addingNew && (
              <ExperienceForm
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

interface ExperienceCardProps {
  entry: WorkExperienceItem;
  onEdit: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}

/**
 * Read-only card that displays a single work experience entry
 * with edit and remove actions.
 */
function ExperienceCard({
  entry,
  onEdit,
  onRemove,
  isRemoving,
}: ExperienceCardProps) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-slate-900">
          {entry.title} · {entry.company}
        </p>
        <p className="text-xs text-slate-500">
          {formatDateRange(entry.startDate, entry.endDate, entry.isCurrent)}
        </p>
        {entry.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {entry.description}
          </p>
        )}
        {entry.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {entry.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEdit}
          aria-label={`Edit ${entry.company}`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={`Remove ${entry.company}`}
        >
          <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
