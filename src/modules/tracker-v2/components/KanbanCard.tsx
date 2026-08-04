"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bookmark, Loader2, RefreshCw } from "lucide-react";
import { AutomationStatus, PipelineStage } from "@/constants/enums";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

interface KanbanCardProps {
  app: SeekerApplicationItem;
  onRetry: (id: string) => void;
  retryingId: string | null;
}

const STAGE_BADGES: Partial<
  Record<PipelineStage, { label: string; className: string }>
> = {
  [PipelineStage.APPLIED]: {
    label: "Applied",
    className: "bg-brand-success/10 text-brand-success",
  },
  [PipelineStage.INTERVIEWING]: {
    label: "Interviewing",
    className: "bg-cyan-50 text-cyan-700",
  },
  [PipelineStage.OFFER]: {
    label: "Offer",
    className: "bg-brand-warning/10 text-brand-warning",
  },
  [PipelineStage.REJECTED]: {
    label: "Rejected",
    className: "bg-brand-danger/10 text-brand-danger",
  },
};

/* Company logo with letter-avatar fallback — plain <img> to avoid next/image host restrictions */
function CompanyLogo({
  companyName,
  logoUrl,
}: {
  companyName: string;
  logoUrl?: string;
}) {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
      <span className="text-xs font-bold text-brand-foreground-muted">
        {companyName[0]}
      </span>
      {logoUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoUrl}
          alt={`${companyName} logo`}
          className="absolute inset-0 h-full w-full bg-white object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

function CardTextBlock({
  app,
  companyName,
  onRetry,
  retryingId,
}: {
  app: SeekerApplicationItem;
  companyName: string;
  onRetry?: (id: string) => void;
  retryingId?: string | null;
}) {
  const isNotApplied = app.pipelineStage === PipelineStage.NOT_APPLIED;
  const isGenerating = app.automationStatus === AutomationStatus.GENERATING;
  const isFailed = app.automationStatus === AutomationStatus.FAILED;
  const locationLabel = app.location ?? app.workType ?? null;

  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-brand-foreground">
        {companyName}
      </p>
      <p className="truncate text-xs text-brand-foreground-muted">
        {app.jobTitle}
      </p>
      {locationLabel && (
        <p className="truncate text-xs text-brand-foreground-secondary">
          {locationLabel}
        </p>
      )}
      {isNotApplied && isGenerating && (
        <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating...
        </span>
      )}
      {isNotApplied && isFailed && (
        <div className="mt-1.5 flex items-center gap-1">
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
            Failed
          </span>
          {onRetry && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRetry(app.id);
              }}
              disabled={retryingId === app.id}
              className="flex h-5 w-5 items-center justify-center rounded text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
              aria-label="Retry generation"
            >
              {retryingId === app.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CardFooter({ app }: { app: SeekerApplicationItem }) {
  const stage = app.pipelineStage ?? PipelineStage.NOT_APPLIED;
  const badge = STAGE_BADGES[stage];
  if (!badge) return null;

  return (
    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-brand-border-light pt-2.5">
      <span
        className={cn(
          "text-[11px]",
          stage === PipelineStage.OFFER
            ? "font-medium text-brand-warning"
            : "text-brand-foreground-secondary",
        )}
      >
        {stage === PipelineStage.OFFER
          ? "● Offer Received"
          : `Applied ${formatRelativeTime(app.appliedAt)}`}
      </span>
      <span
        className={cn(
          "rounded-pill px-2 py-0.5 text-[11px] font-medium",
          badge.className,
        )}
      >
        {badge.label}
      </span>
    </div>
  );
}

/** Visual clone rendered inside DragOverlay — no hooks, no handlers, pure presentation */
export function KanbanCardOverlay({ app }: { app: SeekerApplicationItem }) {
  const companyName = app.companyName || "Unknown Company";

  return (
    <div className="w-[280px] rotate-[2deg] scale-[1.02] rounded-xl border border-brand-border bg-white px-3.5 py-3 shadow-card-hover ring-2 ring-brand-primary/30 sm:w-[300px] lg:w-[320px]">
      <div className="flex items-start gap-2.5">
        <CompanyLogo companyName={companyName} logoUrl={app.companyLogoUrl} />
        <CardTextBlock app={app} companyName={companyName} />
        <span className="shrink-0 text-brand-foreground-secondary">
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
      <CardFooter app={app} />
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none select-none rounded-xl border border-brand-border bg-white px-3.5 py-3 transition-colors active:cursor-grabbing ${
        isDragging ? "opacity-30" : "hover:border-brand-primary/40"
      }`}
      onClick={() => {
        if (!isDragging) router.push(`/applications/${app.id}`);
      }}
    >
      <div className="flex items-start gap-2.5">
        <CompanyLogo companyName={companyName} logoUrl={app.companyLogoUrl} />
        <CardTextBlock
          app={app}
          companyName={companyName}
          onRetry={onRetry}
          retryingId={retryingId}
        />
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/jobs/${app.jobId}`);
          }}
          className="shrink-0 rounded p-0.5 text-brand-foreground-secondary transition-colors hover:bg-brand-surface hover:text-brand-primary"
          aria-label={`View ${app.jobTitle} job listing`}
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <CardFooter app={app} />
    </div>
  );
}
