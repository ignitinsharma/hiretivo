"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, RefreshCw } from "lucide-react";
import { AutomationStatus, PipelineStage } from "@/constants/enums";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

interface KanbanCardProps {
  app: SeekerApplicationItem;
  onRetry: (id: string) => void;
  retryingId: string | null;
}

/** Visual clone rendered inside DragOverlay — no hooks, no handlers, pure presentation */
export function KanbanCardOverlay({ app }: { app: SeekerApplicationItem }) {
  const companyName = app.companyName || "Unknown Company";
  const isNotApplied = app.pipelineStage === PipelineStage.NOT_APPLIED;
  const isGenerating = app.automationStatus === AutomationStatus.GENERATING;
  const isFailed = app.automationStatus === AutomationStatus.FAILED;

  return (
    <div className="bg-white rounded-lg border border-brand-border px-3 py-2.5 shadow-card-hover ring-2 ring-brand-primary/30 rotate-[2deg] scale-[1.02] w-[280px] sm:w-[300px] lg:w-[320px]">
      <CardInner
        companyName={companyName}
        jobTitle={app.jobTitle}
        appliedAt={app.appliedAt}
        isGenerating={isNotApplied && isGenerating}
        isFailed={isNotApplied && isFailed}
      />
    </div>
  );
}

export function KanbanCard({ app, onRetry, retryingId }: KanbanCardProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const companyName = app.companyName || "Unknown Company";
  const isNotApplied = app.pipelineStage === PipelineStage.NOT_APPLIED;
  const automationStatus = app.automationStatus;
  const isGenerating = automationStatus === AutomationStatus.GENERATING;
  const isFailed = automationStatus === AutomationStatus.FAILED;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-brand-border px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing touch-none select-none ${
        isDragging ? "opacity-30" : "hover:shadow-card-hover"
      }`}
      onClick={() => {
        if (!isDragging) router.push(`/applications/${app.id}`);
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-surface flex items-center justify-center text-xs font-bold text-brand-foreground-muted shrink-0">
          {companyName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-foreground truncate">
            {companyName}
          </p>
          <p className="text-xs text-brand-foreground-muted truncate">
            {app.jobTitle}
          </p>
          {isNotApplied && isGenerating && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating...
            </span>
          )}
          {isNotApplied && isFailed && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                Failed
              </span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry(app.id);
                }}
                disabled={retryingId === app.id}
                className="w-5 h-5 rounded flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                aria-label="Retry generation"
              >
                {retryingId === app.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] text-brand-foreground-secondary whitespace-nowrap">
            {app.appliedAt}
          </span>
          <div className="w-5 h-5 flex items-center justify-center text-brand-foreground-secondary pointer-events-none">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shared inner content for both regular card and overlay clone */
function CardInner({
  companyName,
  jobTitle,
  appliedAt,
  isGenerating,
  isFailed,
}: {
  companyName: string;
  jobTitle: string;
  appliedAt: string;
  isGenerating: boolean;
  isFailed: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-brand-surface flex items-center justify-center text-xs font-bold text-brand-foreground-muted shrink-0">
        {companyName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-foreground truncate">
          {companyName}
        </p>
        <p className="text-xs text-brand-foreground-muted truncate">
          {jobTitle}
        </p>
        {isGenerating && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating...
          </span>
        )}
        {isFailed && (
          <span className="inline-block mt-1.5 text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
            Failed
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[11px] text-brand-foreground-secondary whitespace-nowrap">
          {appliedAt}
        </span>
        <div className="w-5 h-5 flex items-center justify-center text-brand-foreground-secondary">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
