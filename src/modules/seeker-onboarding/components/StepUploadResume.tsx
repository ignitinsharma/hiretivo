"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResumeMimeType } from "@/constants/enums";
import { ParsedResumeSchema } from "@/lib/validations/resume-parse.schema";
import { useProgressiveOnboardingStore } from "@/store/use-progressive-onboarding-store";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: string[] = [ResumeMimeType.PDF, ResumeMimeType.DOCX];

/*
 * formatFileSize
 * Renders a byte count as a human-readable KB/MB size label.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ParseResumeResponse {
  data?: { parsed?: unknown; fallback?: "manual"; resumeKey: string };
  error?: string;
}

/*
 * parseResume
 * Uploads the resume file to the parse-resume API route.
 * @param file - the selected PDF/DOCX file
 * @returns parsed API response (data or error)
 */
async function parseResume(file: File): Promise<ParseResumeResponse> {
  const formData = new FormData();
  formData.append("resumeFile", file);
  const res = await fetch("/api/seeker/onboarding/parse-resume", {
    method: "POST",
    body: formData,
  });
  const json = (await res.json()) as ParseResumeResponse;
  if (!res.ok) {
    throw new Error(json.error ?? "Resume parsing failed");
  }
  return json;
}

/*
 * StepUploadResume
 * Upload step of the progressive onboarding flow. Accepts a PDF/DOCX resume,
 * posts it to the parse-resume route, and advances to the review step with
 * either a parsed draft or the manual-fill fallback. Also offers a direct
 * "fill manually" escape hatch for users who don't want to upload.
 */
export function StepUploadResume() {
  const { setParseResult, enterManualFallback } = useProgressiveOnboardingStore();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: parseResume,
    onSuccess: (res) => {
      if (!res.data) return;
      if (res.data.fallback === "manual") {
        enterManualFallback(res.data.resumeKey);
        return;
      }
      const parsed = ParsedResumeSchema.safeParse(res.data.parsed);
      if (parsed.success) {
        setParseResult({ draft: parsed.data, resumeKey: res.data.resumeKey });
      } else {
        enterManualFallback(res.data.resumeKey);
      }
    },
  });

  const handleFile = useCallback((selected: File) => {
    setValidationError(null);
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setValidationError("Please upload a PDF or DOCX file");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setValidationError("File size must be less than 5MB");
      return;
    }
    setFile(selected);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    setFile(null);
    mutation.reset();
  }, [mutation]);

  const handleContinue = () => {
    if (!file) return;
    mutation.mutate(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-semibold text-xl leading-snug tracking-tight text-brand-foreground">
            Upload your resume
          </h2>
          <p className="text-brand-foreground-muted">
            We&apos;ll analyze it and prefill your profile — you review and correct before anything is saved.
          </p>
        </div>

        <div className="space-y-4">
          {file ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-brand-primary bg-brand-surface">
              <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-brand-foreground truncate">{file.name}</p>
                <p className="text-sm text-brand-foreground-muted">{formatFileSize(file.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-success" />
                <button
                  type="button"
                  aria-label="Remove selected file"
                  onClick={handleRemove}
                  className="p-2 rounded-lg hover:bg-brand-danger/10 text-brand-danger"
                  disabled={mutation.isPending}
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
                "relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                isDragging
                  ? "border-brand-primary bg-brand-surface"
                  : "border-brand-border hover:border-brand-primary/50",
              )}
            >
              <input
                type="file"
                accept=".pdf,.docx"
                aria-label="Upload resume file"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 rounded-lg bg-brand-surface flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-brand-foreground-muted" />
              </div>
              <p className="text-brand-foreground font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-brand-foreground-muted">PDF, DOCX (Max 5MB)</p>
            </div>
          )}

          {(validationError || mutation.isError) && (
            <p className="text-sm text-brand-danger text-center">
              {validationError ?? (mutation.error as Error)?.message}
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
            disabled={!file}
            loading={mutation.isPending}
            loadingText="Analyzing your resume…"
          >
            Continue
          </Button>
          <button
            type="button"
            aria-label="Skip upload and fill your profile manually"
            onClick={() => enterManualFallback(null)}
            className="text-sm text-brand-foreground-muted hover:text-brand-foreground text-center underline"
          >
            Fill manually instead
          </button>
        </div>
      </div>
    </div>
  );
}
