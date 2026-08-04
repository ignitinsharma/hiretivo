"use client";

import { useCallback, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { completeSeekerOnboarding } from "@/app/actions/onboarding/seeker";

interface StepResumeProps {
  onBack: () => void;
  onComplete: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

export function StepResume({ onBack, onComplete }: StepResumeProps) {
  const { step3, setResume } = useSeekerOnboardingStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploadError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Please upload a PDF or DOCX file");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("File size must be less than 5MB");
        return;
      }

      setUploadStatus("uploading");
      const objectUrl = URL.createObjectURL(file);

      setResume({
        name: file.name,
        size: file.size,
        type: file.type,
        key: null,
        url: objectUrl,
        file,
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/resume/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setUploadError(body.error ?? "Upload failed. Please try again.");
          setUploadStatus("error");
          return;
        }

        const { data } = await res.json();
        setResume({
          name: file.name,
          size: file.size,
          type: file.type,
          key: data.key,
          url: objectUrl,
          file,
        });
        setUploadStatus("uploaded");
      } catch {
        setUploadError("Upload failed. Please try again.");
        setUploadStatus("error");
      }
    },
    [setResume],
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
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    if (step3.resume?.url) {
      URL.revokeObjectURL(step3.resume.url);
    }
    setResume(null);
    setUploadStatus("idle");
    setUploadError(null);
  }, [setResume, step3.resume]);

  const handleContinue = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      const result = await completeSeekerOnboarding();
      if (!result.success) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
        return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
      case "uploaded":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const statusLabel = uploadStatus === "uploading" ? "Uploading..." : uploadStatus === "uploaded" ? "Uploaded" : "";

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
            <div className={cn(
              "flex items-center gap-4 p-4 rounded-lg border-2",
              uploadStatus === "error"
                ? "border-destructive bg-destructive/5"
                : "border-primary bg-primary/5",
            )}>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {step3.resume.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(step3.resume.size)}
                  {statusLabel && <span className="ml-2">{statusLabel}</span>}
                </p>
                {uploadStatus === "error" && uploadError && (
                  <p className="text-xs text-destructive mt-1">{uploadError}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {renderStatusIcon()}
                {uploadStatus !== "uploading" && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-2 rounded-full hover:bg-destructive/10 text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
              )}
            >
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
            variant="primary"
            className="w-full"
            disabled={uploadStatus === "uploading" || !step3.resume?.key}
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
            {!step3.resume && <div />}
          </div>
        </div>
      </div>
    </div>
  );
}
