"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUIStore } from "@/store/use-ui-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import { JobCard } from "@/components/shared/JobCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, PlusCircle, Plus, AlertTriangle, Wand2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApplyType,
  CurrencyCode,
  JobType,
  SkillLevel,
  WorkType,
} from "@/constants/enums";
import { jobService } from "@/services/job.service";
import { recruiterService } from "@/services/recruiter.service";
import { skillService } from "@/services/skill.service";
import type { SkillItem } from "@/services/skill.service";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-status";
import type { JobListItem } from "@/modules/jobs/types/job.types";
import {
  canonicalizeSkillName,
  slugifySkillName,
} from "@/lib/skills/canonicalize";

import { JdGeneratorPanel } from "./JdGeneratorPanel";
import { SkillSuggestChips } from "./SkillSuggestChips";

interface JobFormValues {
  title: string;
  category: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  description: string;
  selectedSkillIds: string[];
  applyType: ApplyType;
  externalApplyUrl: string;
}

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  jobTitle: string;
  hasApplications: boolean;
  isPending: boolean;
}

const JOB_TYPE_FORM_VALUES = {
  fullTime: "full-time",
  partTime: "part-time",
  contract: "contract",
  internship: "internship",
} as const;

const JOB_TYPE_BY_FORM_VALUE: Record<string, JobType> = {
  [JOB_TYPE_FORM_VALUES.fullTime]: JobType.FULL_TIME,
  [JOB_TYPE_FORM_VALUES.partTime]: JobType.PART_TIME,
  [JOB_TYPE_FORM_VALUES.contract]: JobType.CONTRACT,
  [JOB_TYPE_FORM_VALUES.internship]: JobType.INTERNSHIP,
};

const FORM_VALUE_BY_JOB_TYPE: Record<JobType, string> = {
  [JobType.FULL_TIME]: JOB_TYPE_FORM_VALUES.fullTime,
  [JobType.PART_TIME]: JOB_TYPE_FORM_VALUES.partTime,
  [JobType.CONTRACT]: JOB_TYPE_FORM_VALUES.contract,
  [JobType.INTERNSHIP]: JOB_TYPE_FORM_VALUES.internship,
};

function isWorkTypeValue(value: string | null): value is WorkType {
  return (
    value === WorkType.REMOTE ||
    value === WorkType.HYBRID ||
    value === WorkType.ONSITE
  );
}

function formatSalaryRangePreview(
  min: string,
  max: string,
  currency: string,
): string {
  const symbol =
    currency === CurrencyCode.GBP
      ? "£"
      : currency === CurrencyCode.EUR
        ? "€"
        : currency === CurrencyCode.INR
          ? "₹"
          : "$";
  if (!min && !max) return "Not specified";
  const minText = min ? `${symbol}${Math.round(Number(min) / 1000)}k` : "";
  const maxText = max ? `${symbol}${Math.round(Number(max) / 1000)}k` : "";
  if (min && max) return `${minText} - ${maxText}`;
  return minText || maxText;
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isRichTextEmpty(value: string): boolean {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length === 0;
}

function isExternalUrlValid(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

function getSkillKey(name: string): string {
  return slugifySkillName(name);
}

function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  jobTitle,
  hasApplications,
  isPending,
}: ConfirmDeleteModalProps) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  if (hasApplications) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 pb-2">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Delete active listing?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              This listing has {hasApplications} application(s). Deleting it
              will permanently remove all applicant data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium text-slate-700">
              Type DELETE to confirm
            </Label>
            <Input
              placeholder='Type "DELETE" to confirm'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="font-mono"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="font-bold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={confirmText !== "DELETE" || isPending}
              className="font-bold"
            >
              {isPending ? "Deleting..." : "Delete Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pb-2">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Delete archived listing?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Are you sure you want to permanently delete &ldquo;{jobTitle}
            &rdquo;? This action is irreversible.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
            className="font-bold text-slate-600"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="font-bold"
          >
            {isPending ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PostJobModal() {
  const {
    isPostJobModalOpen,
    closePostJobModal,
    editJobId,
    openEmailVerificationModal,
  } = useUIStore();
  const { data: verificationStatus } = useEmailVerificationStatus();
  const queryClient = useQueryClient();
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJdPanelOpen, setIsJdPanelOpen] = useState(false);
  const [hasJdGenerated, setHasJdGenerated] = useState(false);
  const [autoSuggestTrigger, setAutoSuggestTrigger] = useState(0);
  const [workType, setWorkType] = useState<WorkType>(WorkType.REMOTE);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowSkillDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const DEFAULT_CATEGORIES = [
    "Engineering",
    "Design",
    "Marketing",
    "Data",
    "DevOps",
    "Product",
    "Other",
  ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    mode: "onChange",
    defaultValues: {
      title: "",
      category: "",
      jobType: "",
      experienceLevel: "",
      salaryMin: "",
      salaryMax: "",
      currency: CurrencyCode.USD,
      description: "",
      selectedSkillIds: [],
      applyType: ApplyType.INTERNAL,
      externalApplyUrl: "",
    },
  });

  const selectedSkillIds = watch("selectedSkillIds");
  const formValues = watch();

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: skillService.getSkills,
    enabled: isPostJobModalOpen,
    staleTime: 5 * 60_000,
  });

  const { data: editJob, isLoading: isEditJobLoading } = useQuery({
    queryKey: ["job", editJobId],
    queryFn: () => jobService.getJobById(editJobId ?? ""),
    enabled: isPostJobModalOpen && !!editJobId,
  });
  const { data: recruiterSettings } = useQuery({
    queryKey: ["recruiter-settings"],
    queryFn: recruiterService.getSettings,
    enabled: isPostJobModalOpen,
    staleTime: 60_000,
    select: (data) => ({
      companyName: data.data?.companyName,
      logo: data.data?.logo,
    }),
  });

  const createSkillMutation = useMutation({
    mutationFn: async (name: string) => {
      const canonicalName = canonicalizeSkillName(name);
      return skillService.createSkill({
        name: canonicalName,
        slug: slugifySkillName(canonicalName),
        category: "Other",
      });
    },
    onSuccess: (newSkill) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      const currentSkillIds = getValues("selectedSkillIds") ?? [];
      if (!currentSkillIds.includes(newSkill.id)) {
        setValue("selectedSkillIds", [...currentSkillIds, newSkill.id], {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      setSkillSearch("");
      setShowSkillDropdown(false);
      toast.success(`"${newSkill.name}" added to skills`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    if (editJob && editJobId) {
      const j = editJob.job ?? editJob;
      setWorkType(isWorkTypeValue(j.workType) ? j.workType : WorkType.REMOTE);

      reset({
        title: j.title || "",
        category: j.category || "",
        jobType: j.jobType
          ? (FORM_VALUE_BY_JOB_TYPE[j.jobType as JobType] ?? "")
          : "",
        experienceLevel: j.experienceLevel || "",
        salaryMin: j.salaryMin != null ? String(j.salaryMin) : "",
        salaryMax: j.salaryMax != null ? String(j.salaryMax) : "",
        currency: j.currency ?? CurrencyCode.USD,
        description: j.description || "",
        selectedSkillIds:
          j.skills?.map(
            (s: { id: string; skillId?: string }) => s.skillId ?? s.id,
          ) || [],
        applyType: (j.applyType as ApplyType) ?? ApplyType.INTERNAL,
        externalApplyUrl: j.externalApplyUrl ?? "",
      });
    } else if (!editJobId) {
      setWorkType(WorkType.REMOTE);
      reset({
        title: "",
        category: "",
        jobType: "",
        experienceLevel: "",
        salaryMin: "",
        salaryMax: "",
        currency: CurrencyCode.USD,
        description: "",
        selectedSkillIds: [],
        applyType: ApplyType.INTERNAL,
        externalApplyUrl: "",
      });
    }
  }, [editJob, editJobId, reset]);

  const addSelectedSkill = (skill: Pick<SkillItem, "id" | "name">) => {
    if (selectedSkillIds.includes(skill.id)) {
      setSkillSearch("");
      setShowSkillDropdown(false);
      return;
    }

    setValue("selectedSkillIds", [...selectedSkillIds, skill.id], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSkillSearch("");
    setShowSkillDropdown(false);
  };

  const handleAddSkillFromSearch = () => {
    const trimmedSearch = skillSearch.trim();
    if (!trimmedSearch || skillsLoading || createSkillMutation.isPending) {
      return;
    }

    const searchKey = getSkillKey(trimmedSearch);
    const exactMatch = (skills as SkillItem[]).find(
      (skill) => getSkillKey(skill.name) === searchKey,
    );
    if (exactMatch) {
      addSelectedSkill(exactMatch);
      return;
    }

    const firstVisibleSkill = filteredSkills.find(
      (skill: SkillItem) => !selectedSkillIds.includes(skill.id),
    );
    if (firstVisibleSkill) {
      addSelectedSkill(firstVisibleSkill);
      return;
    }

    createSkillMutation.mutate(trimmedSearch);
  };

  const onSubmit = async (data: JobFormValues) => {
    if (!editJobId && verificationStatus?.requiresVerification) {
      openEmailVerificationModal();
      return;
    }

    const salaryMin = data.salaryMin ? parseInt(data.salaryMin, 10) : null;
    const salaryMax = data.salaryMax ? parseInt(data.salaryMax, 10) : null;

    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      toast.error("Minimum salary cannot exceed maximum salary");
      return;
    }

    if (data.selectedSkillIds.length === 0) {
      toast.error("Please add at least one required skill");
      return;
    }

    const payload = {
      title: data.title,
      description: data.description,
      jobType: JOB_TYPE_BY_FORM_VALUE[data.jobType],
      applyType: data.applyType,
      externalApplyUrl:
        data.applyType === ApplyType.EXTERNAL
          ? data.externalApplyUrl
          : undefined,
      workType,
      experienceLevel: data.experienceLevel,
      category: data.category,
      salaryMin,
      salaryMax,
      currency: data.currency,
      skills: data.selectedSkillIds.map((id) => ({
        skillId: id,
        level: SkillLevel.INTERMEDIATE,
      })),
    };

    setIsSubmitting(true);

    try {
      if (editJobId) {
        await jobService.updateJob(editJobId, payload);
      } else {
        await jobService.createJob(payload);
      }

      toast.success(editJobId ? "Job updated!" : "Job posted!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-active-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-dashboard"] });
      closePostJobModal();
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit job",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedSkillSearch = skillSearch.trim().toLowerCase();
  const searchSkillKey = normalizedSkillSearch
    ? getSkillKey(normalizedSkillSearch)
    : "";
  const filteredSkills = skills.filter((s: { name: string }) => {
    if (!normalizedSkillSearch) return true;
    const skillName = s.name.toLowerCase();
    const skillKey = getSkillKey(s.name);
    return (
      skillName.includes(normalizedSkillSearch) ||
      skillKey.includes(searchSkillKey) ||
      searchSkillKey.includes(skillKey)
    );
  });

  const selectedSkillsData = selectedSkillIds
    .map((id: string) => skills.find((s: { id: string }) => s.id === id))
    .filter((skill): skill is SkillItem => Boolean(skill));

  const previewJob: JobListItem = {
    id: "preview",
    title: watch("title") ? toTitleCase(watch("title")) : "Job Title Preview",
    companyName:
      recruiterSettings?.companyName?.trim() || "Your Company",
    companyLogoUrl: recruiterSettings?.logo ?? undefined,
    location: workType.toLowerCase(),
    salaryRange: formatSalaryRangePreview(
      watch("salaryMin"),
      watch("salaryMax"),
      watch("currency"),
    ),
    tags: selectedSkillsData.map((skill) => skill.name).slice(0, 7),
    matchedSkillNames: selectedSkillsData.map((skill) => skill.name).slice(0, 7),
    postedAt: "Preview",
    jobType: watch("jobType"),
    workType,
    experienceLevel: watch("experienceLevel")
      ? toTitleCase(watch("experienceLevel"))
      : "Not Specified",
    companyIndustry: watch("category") ? toTitleCase(watch("category")) : "General",
    description: watch("description") ? watch("description") : null,
  };

  const noMatch =
    showSkillDropdown &&
    skillSearch &&
    filteredSkills.length === 0 &&
    !skillsLoading;

  const inputErrorClass = (hasError: boolean) =>
    hasError
      ? "border-red-500 focus:border-red-500 focus-visible:ring-red-500"
      : "";

  const salaryMinValue = Number.parseInt(formValues.salaryMin || "", 10);
  const salaryMaxValue = Number.parseInt(formValues.salaryMax || "", 10);
  const hasValidSalary =
    Number.isFinite(salaryMinValue) &&
    Number.isFinite(salaryMaxValue) &&
    salaryMinValue >= 0 &&
    salaryMaxValue >= 0 &&
    salaryMinValue <= salaryMaxValue;
  const canSubmitJob =
    !isSubmitting &&
    !(isEditJobLoading && editJobId) &&
    formValues.title.trim().length > 0 &&
    formValues.category.trim().length > 0 &&
    formValues.jobType.trim().length > 0 &&
    formValues.experienceLevel.trim().length > 0 &&
    hasValidSalary &&
    !isRichTextEmpty(formValues.description) &&
    selectedSkillIds.length > 0 &&
    (formValues.applyType !== ApplyType.EXTERNAL ||
      isExternalUrlValid(formValues.externalApplyUrl));

  return (
    <Dialog
      open={isPostJobModalOpen}
      onOpenChange={(open) => {
        if (!open) closePostJobModal();
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-100 px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            {editJobId ? "Edit Job Post" : "Post a New Role"}
          </DialogTitle>
        </DialogHeader>

        {isEditJobLoading && editJobId ? (
          <div className="px-6 py-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : null}

        <form
          className={`space-y-6 overflow-y-auto px-6 pb-6 ${isEditJobLoading && editJobId ? "hidden" : ""}`}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Senior Software Engineer"
              className={inputErrorClass(!!errors.title)}
              {...register("title", { required: true })}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">Job title is required</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Category <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="category"
                rules={{ required: true }}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                      }}
                    >
                      <SelectTrigger
                        className={inputErrorClass(!!errors.category)}
                      >
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const categoryNames = skills.map(
                            (s: { category: string }) => s.category,
                          ) as string[];
                          const uniqueCategories = categoryNames.filter(
                            (cat: string, i: number) =>
                              categoryNames.indexOf(cat) === i,
                          );
                          const categories =
                            uniqueCategories.length > 0
                              ? uniqueCategories
                              : DEFAULT_CATEGORIES;
                          return categories.map((cat: string) => (
                            <SelectItem key={cat} value={cat.toLowerCase()}>
                              {cat}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-xs text-red-500 mt-1">
                        Category is required
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Work Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={workType}
                onValueChange={(v) => setWorkType(v as WorkType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Work Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WorkType.REMOTE}>Remote</SelectItem>
                  <SelectItem value={WorkType.HYBRID}>Hybrid</SelectItem>
                  <SelectItem value={WorkType.ONSITE}>Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Job Type <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="jobType"
                rules={{ required: true }}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                      }}
                    >
                      <SelectTrigger
                        className={inputErrorClass(!!errors.jobType)}
                      >
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={JOB_TYPE_FORM_VALUES.fullTime}>
                          Full-time
                        </SelectItem>
                        <SelectItem value={JOB_TYPE_FORM_VALUES.partTime}>
                          Part-time
                        </SelectItem>
                        <SelectItem value={JOB_TYPE_FORM_VALUES.contract}>
                          Contract
                        </SelectItem>
                        <SelectItem value={JOB_TYPE_FORM_VALUES.internship}>
                          Internship
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.jobType && (
                      <p className="text-xs text-red-500 mt-1">
                        Job type is required
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Experience Level <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="experienceLevel"
                rules={{ required: true }}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                      }}
                    >
                      <SelectTrigger
                        className={inputErrorClass(!!errors.experienceLevel)}
                      >
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid-level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.experienceLevel && (
                      <p className="text-xs text-red-500 mt-1">
                        Experience level is required
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Min Salary <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                placeholder="e.g. 100000"
                className={inputErrorClass(!!errors.salaryMin)}
                {...register("salaryMin", {
                  required: "Minimum salary is required",
                  validate: (val) => {
                    if (!val) return "Minimum salary is required";
                    const maxVal = parseInt(watch("salaryMax") || "0", 10);
                    if (maxVal > 0 && parseInt(val, 10) > maxVal) {
                      return "Cannot exceed max salary";
                    }
                    return true;
                  },
                })}
              />
              {errors.salaryMin && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.salaryMin.message}
                </p>
              )}
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Max Salary <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                placeholder="e.g. 150000"
                className={inputErrorClass(!!errors.salaryMax)}
                {...register("salaryMax", {
                  required: "Maximum salary is required",
                  validate: (val) => {
                    if (!val) return "Maximum salary is required";
                    const minVal = parseInt(watch("salaryMin") || "0", 10);
                    if (minVal > 0 && parseInt(val, 10) < minVal) {
                      return "Cannot be less than min salary";
                    }
                    return true;
                  },
                })}
              />
              {errors.salaryMax && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.salaryMax.message}
                </p>
              )}
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Currency
              </Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={CurrencyCode.USD} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Controller
                control={control}
                name="applyType"
                render={({ field }) => (
                  <>
                    <Label className="block text-sm font-semibold text-slate-700 mb-2">
                      Apply Type
                    </Label>
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as ApplyType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Apply Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ApplyType.INTERNAL}>
                          Apply via Hiretivo
                        </SelectItem>
                        <SelectItem value={ApplyType.EXTERNAL}>
                          Apply on Company Website
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              />
            </div>
            {watch("applyType") === ApplyType.EXTERNAL && (
              <div>
                <Label className="block text-sm font-semibold text-slate-700 mb-2">
                  External Apply URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="https://company.com/careers/job"
                  className={inputErrorClass(!!errors.externalApplyUrl)}
                  {...register("externalApplyUrl", {
                    required:
                      watch("applyType") === ApplyType.EXTERNAL
                        ? "External URL is required"
                        : false,
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message:
                        "Must be a valid URL starting with http:// or https://",
                    },
                  })}
                />
                {errors.externalApplyUrl && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.externalApplyUrl.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-slate-700">
                Job Description <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setIsJdPanelOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer hover:text-primary/80 transition-colors"
                aria-label="Open AI job description generator"
              >
                <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                {hasJdGenerated ? "Regenerate with AI" : "Generate with AI"}
              </button>
            </div>
            <p className="mb-2 text-xs leading-relaxed text-brand-foreground-muted">
              Tip: add a rough brief like “Frontend Developer with 5 years of
              experience, expert in React, Node.js, and TypeScript” then use
              Generate with AI.
            </p>
            <Controller
              control={control}
              name="description"
              rules={{ required: true }}
              render={({ field }) => (
                <>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Describe the role, responsibilities, and impact..."
                    hasError={!!errors.description}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      Description is required
                    </p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">
              Required Skills <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSkillsData.map((skill) => (
                <span
                  key={skill.id}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-primary/20"
                >
                  {skill.name}
                  <X
                    className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100"
                    onClick={() =>
                      setValue(
                        "selectedSkillIds",
                        selectedSkillIds.filter(
                          (id: string) => id !== skill.id,
                        ),
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  />
                </span>
              ))}
            </div>
            <div className="relative" ref={dropdownRef}>
              <Input
                placeholder={
                  skillsLoading ? "Loading skills..." : "Add more skills..."
                }
                className={`pr-10 ${inputErrorClass(!!errors.selectedSkillIds)}`}
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value);
                  setShowSkillDropdown(true);
                }}
                onFocus={() => setShowSkillDropdown(true)}
                disabled={skillsLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary  flex items-center"
                onClick={handleAddSkillFromSearch}
                disabled={
                  !skillSearch.trim() ||
                  skillsLoading ||
                  createSkillMutation.isPending
                }
                aria-label="Add searched skill"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
              {showSkillDropdown &&
                skillSearch &&
                filteredSkills.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredSkills
                      .filter(
                        (s: { id: string }) => !selectedSkillIds.includes(s.id),
                      )
                      .slice(0, 10)
                      .map(
                        (skill: {
                          id: string;
                          name: string;
                          category: string;
                        }) => (
                          <button
                            key={skill.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                            onClick={() => addSelectedSkill(skill)}
                          >
                            {skill.name}{" "}
                            <span className="text-slate-400 text-xs">
                              ({skill.category})
                            </span>
                          </button>
                        ),
                      )}
                  </div>
                )}
              {noMatch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-primary/5 text-sm text-primary font-medium transition-colors"
                    onClick={() =>
                      createSkillMutation.mutate(skillSearch.trim())
                    }
                    disabled={createSkillMutation.isPending}
                  >
                    <Plus className="w-4 h-4" />
                    {createSkillMutation.isPending
                      ? `Creating "${skillSearch}"...`
                      : `Create "${skillSearch}" as new skill`}
                  </button>
                </div>
              )}
            </div>
            {errors.selectedSkillIds && (
              <p className="text-xs text-red-500 mt-1">
                At least one skill is required
              </p>
            )}
            <SkillSuggestChips
              descriptionText={watch("description")}
              selectedSkillIds={selectedSkillIds}
              allSkills={skills as Array<{ id: string; name: string }>}
              autoTriggerTrigger={autoSuggestTrigger}
              onAddSkill={(skillName) => {
                const allSkillsArr = skills as Array<{
                  id: string;
                  name: string;
                }>;
                const match = allSkillsArr.find(
                  (s) => getSkillKey(s.name) === getSkillKey(skillName),
                );
                if (match) {
                  if (!selectedSkillIds.includes(match.id)) {
                    setValue("selectedSkillIds", [
                      ...selectedSkillIds,
                      match.id,
                    ], {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                } else {
                  // Skill doesn't exist in DB yet — create it automatically
                  createSkillMutation.mutate(skillName);
                }
              }}
            />
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-surface/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brand-foreground">
                  Seeker Preview
                </h3>
                <p className="text-xs text-brand-foreground-muted">
                  Live preview of how this job appears to seekers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={previewDevice === "desktop" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  Desktop
                </Button>
                <Button
                  type="button"
                  variant={previewDevice === "mobile" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  Mobile
                </Button>
              </div>
            </div>
            <div className={previewDevice === "mobile" ? "mx-auto max-w-sm" : ""}>
              <JobCard job={previewJob} isPreview showDescription />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              className="font-bold text-slate-600"
              onClick={closePostJobModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="font-bold bg-brand-primary text-white hover:bg-brand-primary-dark"
              disabled={!canSubmitJob}
            >
              {isSubmitting
                ? editJobId
                  ? "Updating..."
                  : "Publishing..."
                : editJobId
                  ? "Update Job"
                  : "Publish Post"}
            </Button>
          </div>
        </form>

        <JdGeneratorPanel
          open={isJdPanelOpen}
          onOpenChange={setIsJdPanelOpen}
          prefillTitle={watch("title")}
          prefillDescription={watch("description")}
          onGenerated={(jd) => {
            setValue("description", jd, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setHasJdGenerated(true);
            setIsJdPanelOpen(false);
            // Auto-trigger skill suggestions after JD is generated
            setAutoSuggestTrigger((prev) => prev + 1);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDeleteModal };
