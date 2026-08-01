"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/store/use-ui-store";
import { cn } from "@/lib/utils";
import {
  Link,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";

type Tab = "url" | "text";
type State = "idle" | "fetching" | "preview" | "error" | "confirming";

interface JobPreview {
  title: string;
  company: string;
  description: string;
  skills: string[];
}

const SUPPORTED_ATS = [
  { name: "Ashby", logo: "/ats-logos/ashby.png" },
  { name: "Greenhouse", logo: "/ats-logos/greenhouse.svg" },
  { name: "Lever", logo: "/ats-logos/lever.png" },
  { name: "Paylocity", logo: "/ats-logos/paylocity.svg" },
  { name: "Pinpoint HQ", logo: "/ats-logos/pinpoint-hq.svg" },
  { name: "Recruitee" },
] as const;

export function AddCustomJobModal() {
  const router = useRouter();
  const { isAddCustomJobModalOpen, closeAddCustomJobModal } = useUIStore();

  const [tab, setTab] = useState<Tab>("url");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showFullJd, setShowFullJd] = useState(false);
  const [unsupportedAts, setUnsupportedAts] = useState(false);
  const [preview, setPreview] = useState<JobPreview | null>(null);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");

  const reset = useCallback(() => {
    setTab("url");
    setState("idle");
    setError(null);
    setUnsupportedAts(false);
    setPreview(null);
    setShowFullJd(false);
    setUrl("");
    setTitle("");
    setCompany("");
    setDescription("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    closeAddCustomJobModal();
  }, [reset, closeAddCustomJobModal]);

  const handleFetchUrl = useCallback(async () => {
    if (!url.trim()) return;
    setState("fetching");
    setError(null);

    try {
      const res = await fetch("/api/seeker/apply/from-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), previewOnly: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
          setUnsupportedAts(data.unsupportedAts ?? false);
          setError(data.error ?? "Could not parse this URL.");
        } else if (res.status === 409) {
          setError(data.error ?? "You have already applied to this job.");
        } else {
          setError(data.error ?? "Something went wrong. Try pasting the description instead.");
        }
        setState("error");
        return;
      }

      setPreview(data.preview);
      setState("preview");
    } catch {
      setError("Network error. Check your connection and try again.");
      setState("error");
    }
  }, [url]);

  const handleFetchText = useCallback(async () => {
    if (!description.trim()) return;
    setState("fetching");
    setError(null);

    try {
      const res = await fetch("/api/seeker/apply/from-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pastedText: description.trim(),
          previewOnly: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not parse the description.");
        setState("error");
        return;
      }

      setPreview(data.preview);
      setState("preview");
    } catch {
      setError("Network error. Check your connection and try again.");
      setState("error");
    }
  }, [description]);

  const handleConfirm = useCallback(async () => {
    if (!preview) return;
    setState("confirming");

    try {
      const body = {
        ...(tab === "url"
          ? { url: url.trim() }
          : { pastedText: description.trim() }),
        previewOnly: false,
        previewData: preview,
      };

      const res = await fetch("/api/seeker/apply/from-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save job.");
        setState("error");
        return;
      }

      handleClose();
      fetch(`/api/applications/${data.applicationId}/generate`, { method: "POST" }).catch((e) => console.error("Generate failed:", e));
      router.push(`/applications/${data.applicationId}`);
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }, [preview, tab, url, description, handleClose, router]);

  const handleSwitchToText = useCallback(() => {
    setTab("text");
    setState("idle");
    setError(null);
    setPreview(null);
    setShowFullJd(false);
  }, []);

  return (
    <Dialog open={isAddCustomJobModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-brand-foreground">
            Add Custom Job
          </DialogTitle>
          <DialogDescription className="text-brand-foreground-muted">
            Add a job you found outside Hiretivo to generate a tailored resume.
          </DialogDescription>
        </DialogHeader>

        {(state === "preview" || state === "confirming") && preview ? (
          <div
            className={cn(
              "space-y-5 overflow-y-auto",
              showFullJd ? "max-h-[85vh]" : "max-h-[70vh]",
            )}
          >
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Sparkles className="h-5 w-5 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-brand-foreground truncate">
                    {preview.title}
                  </h3>
                  <p className="text-sm text-brand-foreground-muted">
                    {preview.company}
                  </p>
                </div>
              </div>

              {preview.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {preview.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <p
                className={cn(
                  "text-sm text-brand-foreground leading-relaxed whitespace-pre-line",
                  !showFullJd && "line-clamp-4",
                )}
              >
                {preview.description}
              </p>
              {preview.description.length > 280 && (
                <button
                  type="button"
                  aria-expanded={showFullJd}
                  onClick={() => setShowFullJd((v) => !v)}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80"
                >
                  {showFullJd ? "Show Less" : "See More JD"}
                </button>
              )}
                </div>

            {error && (
              <p className="flex items-start gap-2 text-sm text-brand-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleSwitchToText}
                disabled={state === "confirming"}
              >
                Edit
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirm}
                disabled={state === "confirming"}
              >
                {state === "confirming" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm & Generate Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex rounded-lg border border-brand-border p-0.5">
              <button
                type="button"
                onClick={() => { setTab("url"); setState("idle"); setError(null); }}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  tab === "url"
                    ? "bg-brand-primary text-white"
                    : "text-brand-foreground-muted hover:text-brand-foreground",
                )}
              >
                <Link className="mr-1.5 inline-block h-4 w-4" />
                Paste URL
              </button>
              <button
                type="button"
                onClick={() => { setTab("text"); setState("idle"); setError(null); }}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  tab === "text"
                    ? "bg-brand-primary text-white"
                    : "text-brand-foreground-muted hover:text-brand-foreground",
                )}
              >
                <FileText className="mr-1.5 inline-block h-4 w-4" />
                Paste Description
              </button>
            </div>

            {tab === "url" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job-url">Job posting URL</Label>
                  <Input
                    id="job-url"
                    type="url"
                    placeholder="https://company.com/jobs/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={state === "fetching"}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-brand-foreground-muted">We support major ATS:</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {SUPPORTED_ATS.map((ats) => (
                      <div key={ats.name} className="flex items-center gap-1.5">
                        {"logo" in ats && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded border border-brand-border bg-brand-surface">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ats.logo}
                              alt={ats.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <span className="text-xs font-medium text-brand-foreground">{ats.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-brand-foreground-muted">
                    For other platforms, paste the description instead.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-brand-danger/20 bg-brand-danger/5 p-3">
                    <p className="flex items-start gap-2 text-sm text-brand-danger">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {error}
                    </p>
                  </div>
                )}

                {error && (
                  <Button
                    variant={unsupportedAts ? "secondary" : "ghost"}
                    size="sm"
                    className={unsupportedAts ? "" : "text-brand-foreground-muted"}
                    onClick={handleSwitchToText}
                  >
                    Switch to paste description instead
                  </Button>
                )}

                <Button
                  className="w-full"
                  onClick={handleFetchUrl}
                  disabled={!url.trim() || state === "fetching"}
                >
                  {state === "fetching" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Fetch & Preview
                    </>
                  )}
                </Button>
              </div>
            )}

            {tab === "text" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job-description">Job description</Label>
                  <Textarea
                    id="job-description"
                    placeholder="Paste the full job description here..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={state === "fetching"}
                    className="min-h-[180px]"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-brand-danger/20 bg-brand-danger/5 p-3">
                    <p className="flex items-start gap-2 text-sm text-brand-danger">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {error}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleFetchText}
                  disabled={!description.trim() || state === "fetching"}
                >
                  {state === "fetching" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Parse & Preview
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
