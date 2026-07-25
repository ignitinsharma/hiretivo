"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeErrorBoundary } from "./ResumeErrorBoundary";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import { TEMPLATE_DEFAULTS } from "@/lib/validations/resume-style.schema";
import type { ResumeTreeOpts } from "@/lib/resume/style/layout-tree";

interface ResumePdfPreviewProps {
  doc: ResumeDocument;
  config?: ResumeStyleConfig;
  opts?: ResumeTreeOpts;
}

export function ResumePdfPreview({
  doc,
  config,
  opts,
}: ResumePdfPreviewProps) {
  const styleConfig = config ?? TEMPLATE_DEFAULTS.compact;
  const prevBlobUrl = useRef<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) {
        URL.revokeObjectURL(prevBlobUrl.current);
        prevBlobUrl.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const [{ pdf }, { ResumeDocumentTree }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/lib/resume/style/layout-tree"),
        ]);

        if (cancelled) return;

        const blob = await pdf(
          ResumeDocumentTree({ doc, config: styleConfig, opts }),
        ).toBlob();

        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
        prevBlobUrl.current = url;
        setBlobUrl(url);
      } catch (err) {
        if (!cancelled) {
          console.error("[ResumePdfPreview] Render failed:", err);
          setError(String(err));
        }
      }
    }

    render();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, styleConfig]);

  // Loading state — still rendering
  if (!blobUrl && !error) {
    return (
      <div className="rounded-xl border border-brand-border bg-white overflow-hidden">
        <div className="space-y-5 p-8 min-h-[900px]">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-3/4" />
          <div className="pt-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ResumeErrorBoundary>
        <div className="rounded-xl border border-brand-border bg-white overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 px-4 gap-3">
            <p className="text-sm text-brand-foreground-muted">
              Preview unavailable
            </p>
          </div>
        </div>
      </ResumeErrorBoundary>
    );
  }

  return (
    <ResumeErrorBoundary>
      <div className="rounded-xl border border-brand-border bg-white overflow-hidden">
        <iframe
          src={blobUrl!}
          className="w-full min-h-[900px] border-0"
          title="Resume preview"
        />
      </div>
    </ResumeErrorBoundary>
  );
}

/** Fallback card shown when PDF preview fails to render.
 *  Renders a bordered card with an alert message and a Retry button that
 *  remounts the error boundary via a key increment. */
export function ResumePreviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-brand-border bg-white overflow-hidden">
      <div className="flex flex-col items-center justify-center py-16 px-4 gap-3">
        <p className="text-sm text-brand-foreground-muted">
          Preview failed to render
        </p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    </div>
  );
}
