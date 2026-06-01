"use client";

import { useCallback, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Upload,
  FileText,
  X,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  validateSeekerStep5,
  AVAILABILITY_OPTIONS,
} from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import type { ResumeFile } from "@/modules/seeker-onboarding/types/seeker-onboarding.types";
import { saveCompensation } from "@/app/actions/onboarding/seeker";

/*
 * StepCompensation
 * Step 5 of seeker onboarding — Compensation & Resume.
 * Captures professional headline, bio, salary range (USD), availability,
 * contract type preference, and resume upload.
 * Save is stubbed — Task 7 will wire the real saveCompensation action.
 */
interface StepCompensationProps {
  onNext: () => void;
  onBack: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const CONTRACT_OPTIONS = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "BOTH", label: "Both" },
] as const;

type ContractOption = (typeof CONTRACT_OPTIONS)[number]["value"];

/*
 * formatFileSize
 * Converts bytes to a human-readable file size string.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StepCompensation({ onNext, onBack }: StepCompensationProps) {
  const {
    compensation,
    setHeadline,
    setBio,
    setSalaryMinMax,
    setCompensationAvailability,
    setContractType,
    setCompensationResume,
  } = useSeekerOnboardingStore();

  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /* Resume upload handler */
  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError("Please upload a PDF or DOCX file");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError("File size must be less than 5MB");
        return;
      }

      setIsUploading(true);
      try {
        const resumeFile: ResumeFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          key: null,
          url: URL.createObjectURL(file),
          file,
        };
        setCompensationResume(resumeFile);
      } catch {
        setUploadError("Failed to process file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [setCompensationResume],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemoveResume = useCallback(() => {
    if (compensation.resume?.url) {
      URL.revokeObjectURL(compensation.resume.url);
    }
    setCompensationResume(null);
  }, [compensation.resume, setCompensationResume]);

  const handleContinue = async () => {
    const validation = validateSeekerStep5({
      headline: compensation.headline,
      bio: compensation.bio,
      salaryMin: compensation.salaryMin,
      salaryMax: compensation.salaryMax,
      availability: compensation.availability,
      resume: compensation.resume,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);

    // Build FormData so the File object transfers correctly to the server action
    const formData = new FormData();
    formData.append("headline", compensation.headline);
    formData.append("bio", compensation.bio);
    if (compensation.salaryMin !== null) {
      formData.append("salaryMin", String(compensation.salaryMin));
    }
    if (compensation.salaryMax !== null) {
      formData.append("salaryMax", String(compensation.salaryMax));
    }
    if (compensation.availability) {
      formData.append("availability", compensation.availability);
    }
    if (compensation.contractType) {
      formData.append("contractType", compensation.contractType);
    }
    // Append the raw File if available (new upload); skip if it's an existing key-only record
    if (compensation.resume?.file instanceof File) {
      formData.append("resumeFile", compensation.resume.file);
    }

    const result = await saveCompensation(formData);

    if (!result.success) {
      setErrors([result.error]);
      return;
    }

    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/10 mb-4">
            <DollarSign className="w-6 h-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-brand-foreground">
            Compensation &amp; profile
          </h2>
          <p className="text-brand-foreground-muted">
            Salary transparency on both sides — no wasted conversations.
          </p>
        </div>

        <div className="space-y-5">
          {/* Professional headline */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              Professional headline <span className="text-brand-danger">*</span>
            </label>
            <Input
              placeholder="e.g. Senior Full Stack Engineer • 5 years • React, Node.js"
              value={compensation.headline}
              onChange={(e) => {
                setHeadline(e.target.value);
                setErrors([]);
              }}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              Bio <span className="text-brand-danger">*</span>
            </label>
            <textarea
              placeholder="Tell recruiters about yourself — your background, what you've built, what you're looking for"
              value={compensation.bio}
              onChange={(e) => {
                setBio(e.target.value);
                setErrors([]);
              }}
              rows={4}
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
            />
            <p className="text-xs text-brand-foreground-secondary">
              {compensation.bio.length} chars (min 20)
            </p>
          </div>

          {/* Salary range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              Annual salary expectation (USD){" "}
              <span className="text-brand-danger">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-foreground-muted text-sm">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="e.g. 80000"
                  value={compensation.salaryMin ?? ""}
                  onChange={(e) => {
                    setSalaryMinMax(
                      e.target.value ? parseInt(e.target.value, 10) : null,
                      compensation.salaryMax,
                    );
                    setErrors([]);
                  }}
                  className="pl-7"
                />
              </div>
              <span className="text-brand-foreground-muted text-sm">–</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-foreground-muted text-sm">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="e.g. 120000"
                  value={compensation.salaryMax ?? ""}
                  onChange={(e) => {
                    setSalaryMinMax(
                      compensation.salaryMin,
                      e.target.value ? parseInt(e.target.value, 10) : null,
                    );
                    setErrors([]);
                  }}
                  className="pl-7"
                />
              </div>
              <span className="text-sm font-medium text-brand-foreground-muted bg-brand-surface px-3 py-2 rounded-lg border border-brand-border">
                USD
              </span>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              Availability <span className="text-brand-danger">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABILITY_OPTIONS.map((option) => {
                const isSelected = compensation.availability === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setCompensationAvailability(option.value);
                      setErrors([]);
                    }}
                    className={cn(
                      "flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-medium",
                      isSelected
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-brand-border hover:border-brand-primary/50 text-brand-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contract type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              Contract type{" "}
              <span className="text-brand-foreground-secondary text-xs font-normal">
                (optional)
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONTRACT_OPTIONS.map((option) => {
                const isSelected = compensation.contractType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setContractType(
                        isSelected ? null : (option.value as ContractOption),
                      )
                    }
                    className={cn(
                      "flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-medium",
                      isSelected
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-brand-border hover:border-brand-primary/50 text-brand-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resume upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              Resume <span className="text-brand-danger">*</span>
            </label>

            {compensation.resume ? (
              <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-brand-primary bg-brand-primary/5">
                <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-foreground truncate">
                    {compensation.resume.name}
                  </p>
                  <p className="text-sm text-brand-foreground-muted">
                    {formatFileSize(compensation.resume.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-success" />
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="p-2 rounded-lg hover:bg-brand-danger/10 text-brand-danger"
                    aria-label="Remove resume"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center p-10 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                  isDragging
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-brand-border hover:border-brand-primary/50",
                  isUploading && "opacity-50 cursor-wait",
                )}
              >
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <div className="w-14 h-14 rounded-xl bg-brand-surface flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7 text-brand-foreground-muted" />
                </div>
                <p className="text-brand-foreground font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-brand-foreground-muted">
                  PDF, DOCX (Max 5MB)
                </p>
              </div>
            )}

            {uploadError && (
              <p className="text-sm text-brand-danger">{uploadError}</p>
            )}
          </div>

          {errors.length > 0 && (
            <p className="text-sm text-brand-danger text-center">
              {errors[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="button"
            onClick={handleContinue}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isUploading}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
