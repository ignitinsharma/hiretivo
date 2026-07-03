"use client";

import { useRef, useState } from "react";
import { ExternalLink, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/axios";
import { uploadService } from "@/services/upload.service";

interface DocumentsSectionProps {
  resumeKey: string | null | undefined;
}

function getFilename(key: string): string {
  return key.split("/").pop() ?? key;
}

/*
 * DocumentsSection
 * Read-view Documents card: upload/view the source resume, plus generate
 * and preview the ATS-safe tailored PDF via the Phase-3b renderer.
 * @param props - resumeKey (source resume, uploaded)
 */
export function DocumentsSection({ resumeKey }: DocumentsSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadService.uploadResume(file);
      await queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
      toast.success("Resume uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload resume.");
    } finally {
      setIsUploading(false);
    }
  };

  const onView = async (): Promise<void> => {
    setIsViewing(true);
    try {
      const url = await uploadService.getResumeViewUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not load resume. Try again.");
    } finally {
      setIsViewing(false);
    }
  };

  const onPreviewGenerated = async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const { data } = await apiClient.post<{ data: { url: string } }>(
        "/seeker/profile/resume-preview",
      );
      window.open(data.data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not generate resume preview. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-brand-border bg-white">
      <div className="border-b border-brand-border p-6">
        <h3 className="text-lg font-bold text-brand-foreground">Documents</h3>
        <p className="text-sm text-brand-foreground-muted">
          Your uploaded resume and the ATS-safe version generated for applications.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {resumeKey ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-brand-foreground">{getFilename(resumeKey)}</p>
              <button
                type="button"
                onClick={() => void onView()}
                disabled={isViewing}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline disabled:opacity-50"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {isViewing ? "Opening…" : "View"}
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-brand-foreground">No resume uploaded</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(event) => void onUpload(event.target.files?.[0])}
        />
        <Button type="button" variant="primary" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
          {isUploading ? "Uploading..." : "Upload resume"}
        </Button>
      </div>

      <div className="flex flex-col gap-4 border-t border-brand-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand-foreground-secondary" aria-hidden="true" />
          <p className="text-sm text-brand-foreground-muted">
            Generate the tailored, ATS-safe PDF built from your current profile.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void onPreviewGenerated()} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Preview generated resume"}
        </Button>
      </div>
    </section>
  );
}
