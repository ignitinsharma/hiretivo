"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResumeEditor, type ResumeEditorHandle } from "@/modules/applications/components/ResumeEditor";
import { BaseResumePresentation } from "@/modules/applications/components/BaseResumePresentation";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import { resolveStyle, type ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

const ResumePdfPreview = dynamic(() => import("@/modules/applications/components/ResumePdfPreview").then((module) => module.ResumePdfPreview), { ssr: false });

interface BaseResumeResponse {
  data: { id: string | null; resumeJson: ResumeDocument; styleConfig: ResumeStyleConfig; updatedAt: string | null };
}

/* BaseResumePage lets a seeker edit the canonical document used for future tailoring. */
export default function BaseResumePage() {
  const editorRef = useRef<ResumeEditorHandle>(null);
  const [resume, setResume] = useState<BaseResumeResponse["data"] | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ResumeDocument | null>(null);
  const [styleConfig, setStyleConfig] = useState<ResumeStyleConfig>(resolveStyle(undefined));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Loads the user's saved base document, or a blank document for a new user. */
  const load = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/resume/base");
      if (!response.ok) throw new Error("Could not load your base resume.");
      const body = await response.json() as BaseResumeResponse;
      setResume(body.data);
      setPreviewDoc(body.data.resumeJson);
      setStyleConfig(resolveStyle(body.data.styleConfig));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your base resume.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  /* Saves edits to the canonical resume without touching application versions. */
  const save = async (): Promise<void> => {
    const resumeJson = editorRef.current?.getForm();
    if (!resumeJson) return;
    setSaving(true);
    try {
      const response = await fetch("/api/resume/base", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeJson, styleConfig }),
      });
      if (!response.ok) throw new Error("Could not save your base resume.");
      const body = await response.json() as BaseResumeResponse;
      setResume(body.data);
      toast.success("Base resume saved. Future tailored resumes will use these details.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save your base resume.");
    } finally {
      setSaving(false);
    }
  };

  /* Downloads the current document with the same config used by the preview. */
  const download = async (): Promise<void> => {
    const resumeJson = editorRef.current?.getForm();
    if (!resumeJson) return;
    setDownloading(true);
    try {
      const response = await fetch("/api/resume/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeJson, styleConfig }),
      });
      if (!response.ok) throw new Error("Could not export your resume.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "base_resume.pdf";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not export your resume.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-foreground">Base resume</h1>
          <p className="mt-1 text-sm text-brand-foreground-muted">
            Edit the source for future tailored resumes. Existing application versions keep their content.
          </p>
        </div>
        {resume && <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void download()} disabled={downloading}>
            {downloading ? "Exporting…" : "Download PDF"}
          </Button>
          <Button type="button" variant="primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>}
      </div>

      {loading ? (
        <p className="rounded-xl border border-brand-border bg-white p-6 text-sm text-brand-foreground-muted" role="status">Loading your resume…</p>
      ) : error ? (
        <div className="rounded-xl border border-brand-border bg-white p-6">
          <p className="text-sm text-brand-danger" role="alert">{error}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>Retry</Button>
        </div>
      ) : resume ? (
        <div className="space-y-6">
          {!resume.id && <p className="mb-6 text-sm text-brand-foreground-muted">
            Start with a blank resume, or <Link href="/settings" className="text-brand-primary underline">upload a document in Settings</Link>.
          </p>}
          <div className="rounded-xl border border-brand-border bg-white p-4 sm:p-6">
            <BaseResumePresentation config={styleConfig} onChange={setStyleConfig} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-brand-border bg-white p-4 sm:p-6">
              <ResumeEditor ref={editorRef} doc={resume.resumeJson} versionId={resume.updatedAt ?? "new"} onChange={setPreviewDoc} />
            </div>
            <div className="min-w-0 rounded-xl border border-brand-border bg-white p-3" aria-label="Live resume preview">
              <h2 className="mb-3 text-lg font-semibold text-brand-foreground">Live preview</h2>
              {previewDoc && <ResumePdfPreview doc={previewDoc} config={styleConfig} />}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
