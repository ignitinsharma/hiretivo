import { Check, ChevronRight, Loader } from "lucide-react";

export function AIPipelineDemo() {
  return (
    <div
      className="mx-auto mb-8 flex max-w-md items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-xs font-semibold text-brand-foreground-muted"
      role="status"
      aria-label="AI processing pipeline"
    >
      {/* Stage 1: Parsing */}
      <span className="pipeline-stage s1 inline-flex items-center gap-1">
        <span className="pipeline-spinner s1-spin inline-flex">
          <Loader className="pipeline-loading-icon h-3 w-3 animate-spin text-brand-primary" aria-hidden="true" />
        </span>
        <span className="pipeline-check s1-check inline-flex text-brand-success" aria-hidden="true">
          <Check className="h-3 w-3" />
        </span>
        Parsing job...
      </span>

      <ChevronRight className="pipeline-arrow a1 h-3 w-3" aria-hidden="true" />

      {/* Stage 2: Extracting */}
      <span className="pipeline-stage s2 inline-flex items-center gap-1">
        <span className="pipeline-spinner s2-spin inline-flex">
          <Loader className="pipeline-loading-icon h-3 w-3 animate-spin text-brand-primary" aria-hidden="true" />
        </span>
        <span className="pipeline-check s2-check inline-flex text-brand-success" aria-hidden="true">
          <Check className="h-3 w-3" />
        </span>
        Extracting skills...
      </span>

      <ChevronRight className="pipeline-arrow a2 h-3 w-3" aria-hidden="true" />

      {/* Stage 3: Tailoring */}
      <span className="pipeline-stage s3 inline-flex items-center gap-1">
        <span className="pipeline-spinner s3-spin inline-flex">
          <Loader className="pipeline-loading-icon h-3 w-3 animate-spin text-brand-primary" aria-hidden="true" />
        </span>
        <span className="pipeline-check s3-check inline-flex text-brand-success" aria-hidden="true">
          <Check className="h-3 w-3" />
        </span>
        Tailoring resume...
      </span>
    </div>
  );
}
