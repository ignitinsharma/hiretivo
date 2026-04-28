"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadService } from "@/services/upload.service";

interface ResumeSectionProps {
  resumeKey: string | null | undefined;
}

export function ResumeSection({ resumeKey }: ResumeSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadService.uploadResume(file);
      toast.success("Resume uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload resume.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900">Resume</h3>
        <p className="text-sm text-slate-500">
          Upload or replace the resume recruiters can request from your profile.
        </p>
      </div>
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {resumeKey ? "Resume uploaded" : "No resume uploaded"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(event) => void onUpload(event.target.files?.[0])}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-full bg-black text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload resume"}
        </Button>
      </div>
    </section>
  );
}
