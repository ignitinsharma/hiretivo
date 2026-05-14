"use client";

import { useMemo } from "react";
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
import { SkillPicker } from "./SkillPicker";
import { JobType, WorkType, CurrencyCode } from "@/constants/enums";
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

const DEFAULT_CATEGORIES = [
  "Engineering",
  "Design",
  "Marketing",
  "Data",
  "DevOps",
  "Product",
  "Other",
];

/*
 * AdminJobSection
 * Job-detail sub-form rendered inside the admin job create/edit form.
 * Renders title, job type, work type, experience level (Select), category (Select),
 * currency (Select), salary range, apply URL, rich-text description, and delegates
 * skill picking to <SkillPicker/>.
 *
 * @param form - RHF form instance from AdminJobForm
 */
export function AdminJobSection({ form }: Props) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedSkillIds = watch("selectedSkillIds");
  const description = watch("description");

  const { data: skills = [] } = useQuery({
    queryKey: ["skills-all"],
    queryFn: skillService.getSkills,
    staleTime: 5 * 60 * 1000,
  });

  /* Distinct skill categories for category select; falls back to defaults when empty. */
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const s of skills) seen.add(s.category);
    const distinct = Array.from(seen);
    return distinct.length > 0 ? distinct : DEFAULT_CATEGORIES;
  }, [skills]);

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
          <Label>Experience level</Label>
          <Controller
            name="experienceLevel"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid-level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || CurrencyCode.USD}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="USD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CurrencyCode.USD}>USD ($)</SelectItem>
                  <SelectItem value={CurrencyCode.EUR}>EUR (€)</SelectItem>
                  <SelectItem value={CurrencyCode.GBP}>GBP (£)</SelectItem>
                  <SelectItem value={CurrencyCode.INR}>INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            )}
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

      {/* External apply URL — optional at draft; required at publish */}
      <div className="space-y-2">
        <Label htmlFor="externalApplyUrl">Apply URL</Label>
        <Input
          id="externalApplyUrl"
          placeholder="https://company.com/careers/123"
          {...register("externalApplyUrl")}
        />
        <p className="text-xs text-brand-foreground-secondary">
          Required before publishing.
        </p>
        {errors.externalApplyUrl && (
          <p className="text-xs text-brand-danger">
            {errors.externalApplyUrl.message}
          </p>
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

      {/* Skill picker (typeahead + AI suggest) */}
      <SkillPicker
        selectedSkillIds={selectedSkillIds}
        description={description ?? ""}
        onChange={(next) =>
          setValue("selectedSkillIds", next, { shouldValidate: true })
        }
        errorMessage={errors.selectedSkillIds?.message}
      />
    </div>
  );
}
