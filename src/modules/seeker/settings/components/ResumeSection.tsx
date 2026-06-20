"use client";

import { ExternalLink, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { uploadService } from "@/services/upload.service";

interface ResumeSectionProps {
  resumeKey: string | null | undefined;
}

function getFilename(key: string): string {
  return key.split("/").pop() ?? key;
}

export function ResumeSection({ resumeKey }: ResumeSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

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

  return (
    <section className="overflow-hidden rounded-xl border border-brand-border bg-white">
      <div className="border-b border-brand-border-light p-6">
        <h3 className="text-lg font-bold text-slate-900">Resume</h3>
        <p className="text-sm text-slate-500">
          Upload or replace the resume recruiters can request from your profile.
        </p>
      </div>
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {resumeKey ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-700">{getFilename(resumeKey)}</p>
              <button
                type="button"
                onClick={() => void onView()}
                disabled={isViewing}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline disabled:opacity-50"
              >
                <ExternalLink className="h-3 w-3" />
                {isViewing ? "Opening…" : "View"}
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-700">No resume uploaded</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(event) => void onUpload(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="primary"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload resume"}
        </Button>
      </div>
    </section>
  );
}
