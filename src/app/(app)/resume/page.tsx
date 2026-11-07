"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResumeEditor, type ResumeEditorHandle } from "@/modules/applications/components/ResumeEditor";
import type { ResumeDocument } from "@/lib/validations/resume.schema";

interface BaseResumeResponse {
  data: { id: string | null; resumeJson: ResumeDocument; updatedAt: string | null };
}

/* BaseResumePage lets a seeker edit the canonical document used for future tailoring. */
export default function BaseResumePage() {
  const editorRef = useRef<ResumeEditorHandle>(null);
  const [resume, setResume] = useState<BaseResumeResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        body: JSON.stringify({ resumeJson }),
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-foreground">Base resume</h1>
          <p className="mt-1 text-sm text-brand-foreground-muted">
            Edit the source for future tailored resumes. Existing application versions keep their content.
          </p>
        </div>
        {resume && <Button type="button" variant="primary" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>}
      </div>

      {loading ? (
        <p className="rounded-xl border border-brand-border bg-white p-6 text-sm text-brand-foreground-muted" role="status">Loading your resume…</p>
      ) : error ? (
        <div className="rounded-xl border border-brand-border bg-white p-6">
          <p className="text-sm text-brand-danger" role="alert">{error}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>Retry</Button>
        </div>
      ) : resume ? (
        <div className="rounded-xl border border-brand-border bg-white p-4 sm:p-6">
          {!resume.id && <p className="mb-6 text-sm text-brand-foreground-muted">
            Start with a blank resume, or <Link href="/settings" className="text-brand-primary underline">upload a document in Settings</Link>.
          </p>}
          <ResumeEditor ref={editorRef} doc={resume.resumeJson} versionId={resume.updatedAt ?? "new"} />
        </div>
      ) : null}
    </div>
  );
}
