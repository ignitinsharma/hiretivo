"use client";

import { useRef, useState, useEffect } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import { skillService } from "@/services/skill.service";
import { stripHtml } from "@/lib/utils/html-sanitizer";
import { SkillSuggestChips } from "@/modules/recruiter/jobs/components/SkillSuggestChips";
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
 * currency (Select), salary range, apply URL, rich-text description, a skill
 * typeahead with create-on-fly, and an AI "Suggest skills" button backed by
 * SkillSuggestChips.
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

  const queryClient = useQueryClient();

  /* ── skill typeahead state ───────────────────────────────────── */
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSkillDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedSkillIds = watch("selectedSkillIds");
  const description = watch("description");

  /* ── skills query ────────────────────────────────────────────── */
  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["skills-all"],
    queryFn: skillService.getSkills,
    staleTime: 5 * 60 * 1000,
  });

  /* ── derived: skills data for selected IDs ───────────────────── */
  const selectedSkillsData = selectedSkillIds
    .map((id) => skills.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  /* ── filtered skills for typeahead dropdown ──────────────────── */
  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  /* true when search text has no exact/substring match in skills */
  const noMatch =
    showSkillDropdown &&
    skillSearch.trim().length > 0 &&
    filteredSkills.length === 0 &&
    !skillsLoading;

  /* ── create-skill mutation ───────────────────────────────────── */
  const createSkillMutation = useMutation({
    mutationFn: async (name: string) => {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      return skillService.createSkill({ name, slug, category: "Other" });
    },
    onSuccess: (newSkill) => {
      queryClient.invalidateQueries({ queryKey: ["skills-all"] });
      setValue("selectedSkillIds", [...selectedSkillIds, newSkill.id], {
        shouldValidate: true,
      });
      setSkillSearch("");
      setShowSkillDropdown(false);
      toast.success(`"${newSkill.name}" added to skills`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /*
   * removeSkill
   * Removes a skill ID from selectedSkillIds and triggers validation.
   */
  const removeSkill = (skillId: string) => {
    setValue(
      "selectedSkillIds",
      selectedSkillIds.filter((id) => id !== skillId),
      { shouldValidate: true },
    );
  };

  /*
   * addSkillById
   * Adds a skill ID to selectedSkillIds if not already present.
   */
  const addSkillById = (skillId: string) => {
    if (!selectedSkillIds.includes(skillId)) {
      setValue("selectedSkillIds", [...selectedSkillIds, skillId], {
        shouldValidate: true,
      });
    }
  };

  /*
   * handleAddSkillByName
   * Called from SkillSuggestChips. Finds the skill by name in the DB list;
   * if found, adds by ID. If not found, creates it via createSkillMutation.
   */
  const handleAddSkillByName = (skillName: string) => {
    const match = skills.find(
      (s) => s.name.toLowerCase() === skillName.toLowerCase(),
    );
    if (match) {
      addSkillById(match.id);
    } else {
      createSkillMutation.mutate(skillName);
    }
  };

  /* ── derived: unique categories for category Select ─────────── */
  const uniqueCategories = (() => {
    const cats = skills.map((s) => s.category);
    const distinct = cats.filter((c, i) => cats.indexOf(c) === i);
    return distinct.length > 0 ? distinct : DEFAULT_CATEGORIES;
  })();

  /* ── stripped description for AI button guard ────────────────── */
  const strippedDescription = stripHtml(description ?? "");

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

      {/* External apply URL */}
      <div className="space-y-2">
        <Label htmlFor="externalApplyUrl">Apply URL *</Label>
        <Input
          id="externalApplyUrl"
          placeholder="https://company.com/careers/123"
          {...register("externalApplyUrl")}
        />
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

      {/* Skills section */}
      <div className="space-y-2">
        <Label>Skills *</Label>

        {/* Selected skill chips */}
        {selectedSkillsData.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkillsData.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary"
              >
                {skill.name}
                <button
                  type="button"
                  aria-label={`Remove skill ${skill.name}`}
                  onClick={() => removeSkill(skill.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* AI suggest button + SkillSuggestChips */}
        <SkillSuggestChips
          descriptionText={description ?? ""}
          selectedSkillIds={selectedSkillIds}
          allSkills={skills}
          onAddSkill={handleAddSkillByName}
        />

        {/* Typeahead input */}
        <div className="relative" ref={dropdownRef}>
          <Input
            placeholder={skillsLoading ? "Loading skills…" : "Search or add skills…"}
            value={skillSearch}
            onChange={(e) => {
              setSkillSearch(e.target.value);
              setShowSkillDropdown(true);
            }}
            onFocus={() => setShowSkillDropdown(true)}
            disabled={skillsLoading}
            className="pr-10"
            aria-label="Search skills"
            aria-expanded={showSkillDropdown}
            aria-haspopup="listbox"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none">
            <PlusCircle className="w-5 h-5" aria-hidden="true" />
          </span>

          {/* Matching skills dropdown */}
          {showSkillDropdown && skillSearch && filteredSkills.length > 0 && (
            <div
              role="listbox"
              className="absolute z-10 w-full mt-1 bg-white border border-brand-border rounded-lg max-h-48 overflow-y-auto"
            >
              {filteredSkills
                .filter((s) => !selectedSkillIds.includes(s.id))
                .slice(0, 8)
                .map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    role="option"
                    aria-selected={selectedSkillIds.includes(skill.id)}
                    className="w-full text-left px-3 py-2 hover:bg-brand-surface text-sm text-brand-foreground transition-colors"
                    onClick={() => {
                      addSkillById(skill.id);
                      setSkillSearch("");
                      setShowSkillDropdown(false);
                    }}
                  >
                    {skill.name}{" "}
                    <span className="text-brand-foreground-secondary text-xs">
                      ({skill.category})
                    </span>
                  </button>
                ))}
            </div>
          )}

          {/* Create-on-fly option when no match */}
          {noMatch && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-brand-border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-brand-surface text-sm text-brand-primary font-medium transition-colors"
                onClick={() => createSkillMutation.mutate(skillSearch.trim())}
                disabled={createSkillMutation.isPending}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                {createSkillMutation.isPending
                  ? `Creating "${skillSearch.trim()}"…`
                  : `Create "${skillSearch.trim()}" as new skill`}
              </button>
            </div>
          )}
        </div>

        {errors.selectedSkillIds && (
          <p className="text-xs text-brand-danger">
            {errors.selectedSkillIds.message}
          </p>
        )}
      </div>
    </div>
  );
}
