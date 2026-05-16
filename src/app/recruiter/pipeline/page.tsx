/*
 * PipelinePage
 * Server component rendering the recruiter pipeline kanban at /recruiter/pipeline.
 * Shows all applications across the recruiter's jobs grouped into 6 status columns.
 * Auth is enforced by the parent recruiter layout's AuthGuard.
 * Renders PipelineBoard as a client island for interactive card moves.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PipelineBoard } from "./PipelineBoard";

export default function PipelinePage() {
  return (
    <div className="w-full p-8 space-y-6">
      {/* Back link */}
      <Link
        href="/recruiter/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-brand-foreground-muted hover:text-brand-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Page header */}
      <div>
        <h1 className="font-bold text-3xl md:text-4xl leading-tight tracking-tight text-brand-foreground">
          Candidate Pipeline
        </h1>
        <p className="mt-2 text-brand-foreground-muted text-base">
          Manage application statuses across all your jobs
        </p>
      </div>

      {/* Board */}
      <PipelineBoard />
    </div>
  );
}
