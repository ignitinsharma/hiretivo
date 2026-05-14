"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import { skillService } from "@/services/skill.service";
import { JobType, WorkType } from "@/constants/enums";
import type { AdminJobFormValues } from "../types/admin-job.types";

interface Props {
  form: UseFormReturn<AdminJobFormValues>;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  [JobType.FULL_TIME]: "Full-time",
  [JobType.PART_TIME]: "Part-time",
  [JobType.CONTRACT]: "Contract",
  [JobType.INTERNSHIP]: "Internship",
};

const WORK_TYPE_LABELS: Record<string, string> = {
  [WorkType.REMOTE]: "Remote",
  [WorkType.HYBRID]: "Hybrid",
  [WorkType.ONSITE]: "Onsite",
};

/*
 * AdminJobSection
 * Job-detail sub-form rendered inside the admin job create/edit form.
 * Renders title, job type, work type, experience level, category, currency,
 * salary range, apply URL, rich-text description, and a multi-skill picker.
 * Skills are fetched from the skills API and toggled via selectedSkillIds.
 */
export function AdminJobSection({ form }: Props) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selected = watch("selectedSkillIds");

  const { data: skills } = useQuery({
    queryKey: ["skills-all"],
    queryFn: skillService.getSkills,
    staleTime: 5 * 60 * 1000,
  });

  /*
   * toggleSkill
   * Adds or removes a skill ID from selectedSkillIds.
   * Triggers validation so the "at least one skill" error clears on first selection.
   */
  const toggleSkill = (skillId: string) => {
    const current = selected ?? [];
    if (current.includes(skillId)) {
      setValue(
        "selectedSkillIds",
        current.filter((id) => id !== skillId),
        { shouldValidate: true },
      );
    } else {
      setValue("selectedSkillIds", [...current, skillId], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-brand-border bg-white p-6">
      <h2 className="font-semibold text-xl text-brand-foreground">Job</h2>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-xs text-brand-danger">{errors.title.message}</p>
        )}
      </div>

      {/* Job type + Work type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Job type *</Label>
          <Controller
            name="jobType"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.jobType && (
            <p className="text-xs text-brand-danger">{errors.jobType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Work type</Label>
          <Controller
            name="workType"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORK_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Experience level + Category + Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience level</Label>
          <Input
            id="experienceLevel"
            placeholder="e.g. Senior"
            {...register("experienceLevel")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            placeholder="e.g. Engineering"
            {...register("category")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            placeholder="USD"
            maxLength={3}
            {...register("currency")}
          />
        </div>
      </div>

      {/* Salary range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salaryMin">Salary min</Label>
          <Input id="salaryMin" type="number" {...register("salaryMin")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salaryMax">Salary max</Label>
          <Input id="salaryMax" type="number" {...register("salaryMax")} />
        </div>
      </div>

      {/* External apply URL */}
      <div className="space-y-2">
        <Label htmlFor="externalApplyUrl">Apply URL *</Label>
        <Input
          id="externalApplyUrl"
          placeholder="https://company.com/careers/123"
          {...register("externalApplyUrl")}
        />
        {errors.externalApplyUrl && (
          <p className="text-xs text-brand-danger">{errors.externalApplyUrl.message}</p>
        )}
      </div>

      {/* Rich-text description */}
      <div className="space-y-2">
        <Label>Description *</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.description && (
          <p className="text-xs text-brand-danger">{errors.description.message}</p>
        )}
      </div>

      {/* Skill picker */}
      <div className="space-y-2">
        <Label>Skills *</Label>
        <div className="flex flex-wrap gap-2">
          {(skills ?? []).map((s) => {
            const isSelected = selected?.includes(s.id);
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => toggleSkill(s.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? "bg-brand-primary text-brand-primary-foreground border-brand-primary"
                    : "bg-white text-brand-foreground border-brand-border hover:bg-brand-surface"
                }`}
                aria-pressed={isSelected}
                aria-label={`Toggle skill ${s.name}`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        {errors.selectedSkillIds && (
          <p className="text-xs text-brand-danger">{errors.selectedSkillIds.message}</p>
        )}
      </div>
    </div>
  );
}
