"use client";

import { useState } from "react";
import { BlobProvider } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ResumeDocumentTree } from "@/lib/resume/style/layout-tree";
import { ResumeErrorBoundary } from "./ResumeErrorBoundary";
import { ResumeSkeleton } from "./ResumeSkeleton";
import { useDebouncedDoc } from "./use-debounced-doc";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import { TEMPLATE_DEFAULTS } from "@/lib/validations/resume-style.schema";
import type { ResumeTreeOpts } from "@/lib/resume/style/layout-tree";

interface ResumePdfPreviewProps {
  doc: ResumeDocument;
  config?: ResumeStyleConfig;
  opts?: ResumeTreeOpts;
}

/* ResumePreviewError — fallback card shown when PDF preview fails to render. */
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

/* ResumePdfPreview — renders live PDF preview in iframe via react-pdf BlobProvider.
 * Debounces re-renders on style config changes. WYSIWYG with downloaded PDF. */
export function ResumePdfPreview({
  doc,
  config,
  opts,
}: ResumePdfPreviewProps) {
  const styleConfig = config ?? TEMPLATE_DEFAULTS.compact;
  const { debouncedDoc, pending } = useDebouncedDoc(
    { doc, config: styleConfig, opts },
    250,
  );
  const [errorKey, setErrorKey] = useState(0);

  return (
    <ResumeErrorBoundary
      key={errorKey}
      fallback={<ResumePreviewError onRetry={() => setErrorKey((k) => k + 1)} />}
    >
      <div className="relative">
        {pending && (
          <div className="absolute right-2 top-2 z-10 text-xs text-brand-foreground-muted bg-white/80 px-1.5 py-0.5 rounded">
            Updating…
          </div>
        )}
        <BlobProvider document={<ResumeDocumentTree {...debouncedDoc} />}>
          {({ url, loading }) =>
            loading || !url ? (
              <ResumeSkeleton />
            ) : (
              <iframe
                src={url}
                className="w-full min-h-[900px] border-0"
                title="Resume preview"
              />
            )
          }
        </BlobProvider>
      </div>
    </ResumeErrorBoundary>
  );
}
