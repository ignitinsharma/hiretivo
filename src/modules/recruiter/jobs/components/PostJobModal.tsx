"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, PlusCircle, Plus, AlertTriangle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
}

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  jobTitle: string;
  hasApplications: boolean;
  isPending: boolean;
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
              This listing has {hasApplications} application(s). Deleting it will
              permanently remove all applicant data.
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
              variant="outline"
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
            variant="outline"
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
  const { isPostJobModalOpen, closePostJobModal, editJobId } = useUIStore();
  const queryClient = useQueryClient();
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workType, setWorkType] = useState<"REMOTE" | "HYBRID" | "ONSITE">(
    "REMOTE",
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
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    defaultValues: {
      title: "",
      category: "",
      jobType: "",
      experienceLevel: "",
      salaryMin: "",
      salaryMax: "",
      currency: "USD",
      description: "",
      selectedSkillIds: [],
    },
  });

  const selectedSkillIds = watch("selectedSkillIds");

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: () => fetch("/api/skills").then((r) => r.json()),
    enabled: isPostJobModalOpen,
  });

  const { data: editJob } = useQuery({
    queryKey: ["job", editJobId],
    queryFn: () => fetch(`/api/jobs/${editJobId}`).then((r) => r.json()),
    enabled: isPostJobModalOpen && !!editJobId,
  });

  const createSkillMutation = useMutation({
    mutationFn: async (name: string) => {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, category: "Other" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create skill");
      }
      return res.json();
    },
    onSuccess: (newSkill) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setValue("selectedSkillIds", [...selectedSkillIds, newSkill.id]);
      setSkillSearch("");
      setShowSkillDropdown(false);
      toast.success(`"${newSkill.name}" added to skills`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    if (editJob && editJobId) {
      setWorkType(editJob.workType ?? "REMOTE");

      reset({
        title: editJob.title || "",
        category: editJob.category || "",
        jobType: editJob.jobType?.toLowerCase().replace("_", "-") || "",
        experienceLevel: editJob.experienceLevel || "",
        salaryMin: editJob.salaryMin != null ? String(editJob.salaryMin) : "",
        salaryMax: editJob.salaryMax != null ? String(editJob.salaryMax) : "",
        currency: editJob.currency ?? "USD",
        description: editJob.description || "",
        selectedSkillIds:
          editJob.skills?.map((s: { skillId: string }) => s.skillId) || [],
      });
    } else if (!editJobId) {
      setWorkType("REMOTE");
      reset({
        title: "",
        category: "",
        jobType: "",
        experienceLevel: "",
        salaryMin: "",
        salaryMax: "",
        currency: "USD",
        description: "",
        selectedSkillIds: [],
      });
    }
  }, [editJob, editJobId, reset]);

  const onSubmit = async (data: JobFormValues) => {
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
      jobType: data.jobType.toUpperCase().replace("-", "_"),
      applyType: "INTERNAL" as const,
      workType,
      experienceLevel: data.experienceLevel,
      category: data.category,
      salaryMin,
      salaryMax,
      currency: data.currency,
      skills: data.selectedSkillIds.map((id) => ({
        skillId: id,
        level: "INTERMEDIATE" as const,
      })),
    };

    setIsSubmitting(true);

    try {
      const url = editJobId ? `/api/jobs/${editJobId}` : "/api/jobs";
      const method = editJobId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          toast.error(result.error || "Upgrade your plan to post more jobs");
        } else if (res.status === 400) {
          toast.error(result.error || "Validation failed");
        } else {
          toast.error("Something went wrong");
        }
        return;
      }

      toast.success(editJobId ? "Job updated!" : "Job posted!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      closePostJobModal();
      reset();
    } catch {
      toast.error("Failed to submit job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSkills = skills.filter((s: { name: string }) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const selectedSkillsData = selectedSkillIds
    .map((id: string) => skills.find((s: { id: string }) => s.id === id))
    .filter(Boolean);

  const noMatch =
    showSkillDropdown &&
    skillSearch &&
    filteredSkills.length === 0 &&
    !skillsLoading;

  const inputErrorClass = (hasError: boolean) =>
    hasError
      ? "border-red-500 focus:border-red-500 focus-visible:ring-red-500"
      : "";

  return (
    <Dialog
      open={isPostJobModalOpen}
      onOpenChange={(open) => {
        if (!open) closePostJobModal();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b border-slate-100 pb-4 mb-4 shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            {editJobId ? "Edit Job Post" : "Post a New Role"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-6 overflow-y-auto px-6 pb-6" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                    <Select value={field.value} onValueChange={(v) => { field.onChange(v); }}>
                      <SelectTrigger className={inputErrorClass(!!errors.category)}>
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
                      <p className="text-xs text-red-500 mt-1">Category is required</p>
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
                onValueChange={(v) =>
                  setWorkType(v as "REMOTE" | "HYBRID" | "ONSITE")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Work Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="ONSITE">Onsite</SelectItem>
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
                    <Select value={field.value} onValueChange={(v) => { field.onChange(v); }}>
                      <SelectTrigger className={inputErrorClass(!!errors.jobType)}>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.jobType && (
                      <p className="text-xs text-red-500 mt-1">Job type is required</p>
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
                    <Select value={field.value} onValueChange={(v) => { field.onChange(v); }}>
                      <SelectTrigger className={inputErrorClass(!!errors.experienceLevel)}>
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid-level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.experienceLevel && (
                      <p className="text-xs text-red-500 mt-1">Experience level is required</p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Min Salary
              </Label>
              <Input
                type="number"
                placeholder="e.g. 100000"
                className={inputErrorClass(!!errors.salaryMin)}
                {...register("salaryMin", {
                  validate: (val) => {
                    if (!val) return true;
                    const maxVal = parseInt(watch("salaryMax") || "0", 10);
                    if (maxVal > 0 && parseInt(val, 10) > maxVal) {
                      return "Cannot exceed max salary";
                    }
                    return true;
                  },
                })}
              />
              {errors.salaryMin && (
                <p className="text-xs text-red-500 mt-1">{errors.salaryMin.message}</p>
              )}
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Max Salary
              </Label>
              <Input
                type="number"
                placeholder="e.g. 150000"
                className={inputErrorClass(!!errors.salaryMax)}
                {...register("salaryMax", {
                  validate: (val) => {
                    if (!val) return true;
                    const minVal = parseInt(watch("salaryMin") || "0", 10);
                    if (minVal > 0 && parseInt(val, 10) < minVal) {
                      return "Cannot be less than min salary";
                    }
                    return true;
                  },
                })}
              />
              {errors.salaryMax && (
                <p className="text-xs text-red-500 mt-1">{errors.salaryMax.message}</p>
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
                      <SelectValue placeholder="USD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">
              Job Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Describe the role, responsibilities, and impact..."
              className={`resize-none min-h-[120px] ${inputErrorClass(!!errors.description)}`}
              {...register("description", { required: true })}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">Description is required</p>
            )}
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">
              Required Skills <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSkillsData.map((skill: { id: string; name: string }) => (
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary flex items-center"
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
                            onClick={() => {
                              setValue("selectedSkillIds", [
                                ...selectedSkillIds,
                                skill.id,
                              ]);
                              setSkillSearch("");
                              setShowSkillDropdown(false);
                            }}
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
                    onClick={() => createSkillMutation.mutate(skillSearch.trim())}
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
              <p className="text-xs text-red-500 mt-1">At least one skill is required</p>
            )}
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
              className="font-bold bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Publish Job Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDeleteModal };
