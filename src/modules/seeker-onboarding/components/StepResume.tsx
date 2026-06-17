"use client";

import { useCallback, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { saveStep3 } from "@/app/actions/onboarding/seeker";

interface StepResumeProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void | Promise<void>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function StepResume({ onNext, onBack, onSkip }: StepResumeProps) {
  const { step3, setResume } = useSeekerOnboardingStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Please upload a PDF or DOCX file");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("File size must be less than 5MB");
        return;
      }

      setIsUploading(true);

      try {
        setResume({
          name: file.name,
          size: file.size,
          type: file.type,
          key: null,
          url: URL.createObjectURL(file),
          file,
        });
      } catch {
        setError("Failed to process file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [setResume],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    if (step3.resume?.url) {
      URL.revokeObjectURL(step3.resume.url);
    }
    setResume(null);
  }, [setResume, step3.resume]);

  const handleContinue = async () => {
    if (isSaving) return;
    const formData = new FormData();
    if (step3.resume?.file) {
      formData.append("resumeFile", step3.resume.file);
    }

    setIsSaving(true);
    const result = await saveStep3(formData);
    setIsSaving(false);

    if (!result.success) {
      setError("Failed to save resume. Please try again.");
      return;
    }

    onNext();
  };

  const handleSkip = async () => {
    if (!onSkip || isSkipping) return;
    setIsSkipping(true);
    setError(null);
    try {
      await onSkip();
    } finally {
      setIsSkipping(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Upload your resume
          </h2>
          <p className="text-muted-foreground">
            We&apos;ll parse your resume to automatically fill your profile.
          </p>
        </div>

        <div className="space-y-4">
          {step3.resume ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-primary bg-primary/5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {step3.resume.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(step3.resume.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-black" />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 rounded-full hover:bg-destructive/10 text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative flex flex-col items-center justify-center p-12 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
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
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, DOCX (Max 5MB)
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="button"
            onClick={handleContinue}
            size="lg"
            variant={"primary"}
            className="w-full"
            disabled={isUploading}
            loading={isSaving}
            loadingText="Saving..."
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            {onSkip && !step3.resume && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                className="w-auto"
                loading={isSkipping}
                loadingText="Skipping..."
              >
                Skip for now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
