"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ParseState =
  | { status: "checking" }
  | { status: "parsing" }
  | { status: "parsed" }
  | { status: "failed"; error: string }
  | { status: "no_resume" };

export function ResumeParseBanner() {
  const [state, setState] = useState<ParseState>({ status: "checking" });

  const checkStatus = useCallback(async () => {
    setState({ status: "checking" });
    try {
      const res = await fetch("/api/resume/parse-status");
      if (!res.ok) {
        setState({ status: "no_resume" });
        return;
      }
      const body = await res.json();
      if (body.status === "unparsed") {
        setState({ status: "parsing" });
        triggerParse();
      } else if (body.status === "parsed") {
        setState({ status: "parsed" });
      } else {
        setState({ status: "no_resume" });
      }
    } catch {
      setState({ status: "no_resume" });
    }
  }, []);

  const triggerParse = useCallback(async () => {
    try {
      const res = await fetch("/api/resume/parse", { method: "POST" });
      if (res.ok) {
        setState({ status: "parsed" });
      } else {
        const body = await res.json().catch(() => ({}));
        const error = body.error ?? "Could not parse resume.";
        // auto-retry once
        try {
          const retryRes = await fetch("/api/resume/parse", { method: "POST" });
          if (retryRes.ok) {
            setState({ status: "parsed" });
          } else {
            setState({ status: "failed", error });
          }
        } catch {
          setState({ status: "failed", error });
        }
      }
    } catch {
      setState({ status: "failed", error: "Could not parse resume." });
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (state.status === "no_resume" || state.status === "parsed") return null;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-center gap-3",
        state.status === "failed"
          ? "border-destructive/20 bg-destructive/5"
          : "border-brand-primary/20 bg-brand-primary/5",
      )}
    >
      {state.status === "checking" || state.status === "parsing" ? (
        <Loader2 className="w-5 h-5 animate-spin text-brand-primary shrink-0" />
      ) : state.status === "failed" ? (
        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {state.status === "checking" && (
          <p className="text-sm text-brand-foreground-muted">Checking resume...</p>
        )}
        {state.status === "parsing" && (
          <p className="text-sm font-medium text-brand-foreground">
            Analyzing your resume...
          </p>
        )}
        {state.status === "failed" && (
          <div>
            <p className="text-sm font-medium text-destructive">
              Couldn&apos;t parse your resume
            </p>
            <p className="text-xs text-destructive/80 mt-0.5">
              {state.error}
            </p>
          </div>
        )}
      </div>
      {state.status === "failed" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={triggerParse}
          className="shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
