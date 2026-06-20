"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillsTagInput } from "@/components/forms/skills-tag-input";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import { cn } from "@/lib/utils";
import { SUPPORT_URL } from "@/lib/config";
import { OnboardingJobType } from "@/constants/enums";
import type {
  JobType,
  ExperienceLevel,
  JobCategory,
} from "@/lib/validations/recruiter-onboarding.schema";
import { useOnboardingStore } from "@/store/use-recruiter-onboarding-store";
import { createJobFromOnboarding } from "@/app/actions/onboarding/recruiter";

interface StepPostJobProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void | Promise<void>;
  isSkipping?: boolean;
}

const jobTypeOptions: { value: JobType; label: string }[] = [
  { value: OnboardingJobType.FULL_TIME, label: "Full-time" },
  { value: OnboardingJobType.CONTRACT, label: "Contract" },
  { value: OnboardingJobType.PART_TIME, label: "Part-time" },
  { value: OnboardingJobType.FREELANCE, label: "Freelance" },
];

const experienceOptions: { value: ExperienceLevel; label: string }[] = [
  { value: "ENTRY_LEVEL", label: "Entry Level" },
  { value: "MID_LEVEL", label: "Mid-Level" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD_DIRECTOR", label: "Lead / Director" },
];

const categoryOptions: { value: JobCategory; label: string }[] = [
  { value: "ENGINEERING", label: "Engineering" },
  { value: "DESIGN", label: "Design" },
  { value: "MARKETING", label: "Marketing" },
  { value: "PRODUCT_MANAGEMENT", label: "Product Management" },
  { value: "SALES", label: "Sales" },
];

export function StepPostJob({
  onNext,
  onBack,
  onSkip,
  isSkipping,
}: StepPostJobProps) {
  const {
    step3,
    setJobTitle,
    setJobType,
    setExperienceLevel,
    setCategory,
    setSalaryRange,
    setJobDescription,
    setRequiredSkills,
  } = useOnboardingStore();

  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const validateStep = (): boolean => {
    const newErrors: string[] = [];

    if (!step3.jobTitle.trim()) {
      newErrors.push("Job title is required");
    }
    if (!step3.jobType) {
      newErrors.push("Please select job type");
    }
    if (!step3.experienceLevel) {
      newErrors.push("Please select experience level");
    }
    if (!step3.category) {
      newErrors.push("Please select category");
    }
    if (step3.jobDescription.trim().length < 50) {
      newErrors.push("Job description must be at least 50 characters");
    }
    if (step3.requiredSkills.length === 0) {
      newErrors.push("At least one skill is required");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleContinue = async () => {
    if (isSaving) return;
    if (validateStep()) {
      // Persist job to DB before advancing (per D-06)
      setIsSaving(true);
      const result = await createJobFromOnboarding({
        title: step3.jobTitle,
        description: step3.jobDescription,
        jobType: step3.jobType!,
        experienceLevel: step3.experienceLevel,
        category: step3.category,
        salaryMin: step3.salaryRange.min,
        salaryMax: step3.salaryRange.max,
        requiredSkills: step3.requiredSkills,
      });

      if (!result.success) {
        setErrors([result.error]);
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      onNext();
    }
  };

  const OptionButton = ({
    selected,
    onClick,
    children,
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-medium",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-primary/50 text-foreground",
      )}
    >
      {children}
    </button>
  );

  const getErrorMessage = () => {
    if (errors.includes("Job title is required"))
      return "Job title is required";
    if (errors.includes("Please select job type"))
      return "Please select job type";
    if (errors.includes("Please select experience level"))
      return "Please select experience level";
    if (errors.includes("Please select category"))
      return "Please select category";
    if (errors.includes("Job description must be at least 50 characters"))
      return "Job description must be at least 50 characters";
    if (errors.includes("At least one skill is required"))
      return "At least one skill is required";
    return errors[0] ?? null;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">
            Post your first job
          </h2>
          <p className="text-muted-foreground">
            You can edit this any time from your dashboard.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Job Title
              </label>
              <Input
                placeholder="e.g. Senior React Developer"
                value={step3.jobTitle}
                onChange={(e) => {
                  setJobTitle(e.target.value);
                  setErrors([]);
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Job Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {jobTypeOptions.map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={step3.jobType === option.value}
                      onClick={() => {
                        setJobType(option.value);
                        setErrors([]);
                      }}
                    >
                      {option.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Experience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {experienceOptions.map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={step3.experienceLevel === option.value}
                      onClick={() => {
                        setExperienceLevel(option.value);
                        setErrors([]);
                      }}
                    >
                      {option.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Category
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {categoryOptions.slice(0, 4).map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={step3.category === option.value}
                      onClick={() => {
                        setCategory(option.value);
                        setErrors([]);
                      }}
                    >
                      {option.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Salary Range (USD)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={step3.salaryRange.min ?? ""}
                    onChange={(e) =>
                      setSalaryRange(
                        e.target.value ? parseInt(e.target.value) : null,
                        step3.salaryRange.max,
                      )
                    }
                    className="pl-7"
                  />
                </div>
                <span className="text-muted-foreground">–</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={step3.salaryRange.max ?? ""}
                    onChange={(e) =>
                      setSalaryRange(
                        step3.salaryRange.min,
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Job Description
              </label>
              <RichTextEditor
                value={step3.jobDescription}
                onChange={(html) => {
                  setJobDescription(html);
                  setErrors([]);
                }}
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Required Skills
              </label>
              <SkillsTagInput
                value={step3.requiredSkills}
                onChange={(skills) => {
                  setRequiredSkills(skills);
                  setErrors([]);
                }}
                placeholder="e.g. React, TypeScript, Node.js"
              />
            </div>

            {getErrorMessage() && (
              <p className="text-sm text-destructive text-center">
                {getErrorMessage()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              onClick={handleContinue}
              size="lg"
              variant="primary"
              className="w-full"
              loading={isSaving}
              loadingText="Posting..."
            >
              Post Job & Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              {onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  loading={isSkipping}
                  loadingText="Skipping..."
                >
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link href={SUPPORT_URL} className="text-primary hover:underline">
            Chat with an expert
          </Link>
        </p>
      </div>
    </div>
  );
}
