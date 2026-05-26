/*
 * PipelineCard
 * Displays an application card in the pipeline kanban with engineer name
 * (blurred if not unlocked), job title, match score, applied date, and
 * a status move select for changing the application's column.
 * Props: card (PipelineCard), onMove callback, isMoving flag.
 */

"use client";

import { Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PipelineCardData {
  id: string;
  engineerId: string;
  engineerName: string;
  isBlurred: boolean;
  jobTitle: string;
  matchScore: number;
  appliedAt: string;
  status: string;
}

interface PipelineCardProps {
  card: PipelineCardData;
  onMove: (id: string, status: string) => void;
  isMoving: boolean;
}

const STATUS_OPTIONS = [
  "APPLIED",
  "REVIEWING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

function getScoreBadgeClass(score: number): string {
  if (score >= 70) return "bg-green-100 text-green-800";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function PipelineCard({ card, onMove, isMoving }: PipelineCardProps) {
  const otherStatuses = STATUS_OPTIONS.filter((s) => s !== card.status);

  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 flex flex-col gap-3">
      {/* Name row */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-semibold text-base text-brand-foreground",
            card.isBlurred && "blur-sm select-none",
          )}
        >
          {card.engineerName}
        </span>
        {card.isBlurred && (
          <Lock className="h-3.5 w-3.5 text-brand-foreground-muted flex-shrink-0" />
        )}
      </div>

      {/* Job title */}
      <p className="text-sm text-brand-foreground-muted">{card.jobTitle}</p>

      {/* Match score badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xs font-medium rounded px-2 py-0.5",
            getScoreBadgeClass(card.matchScore),
          )}
        >
          {card.matchScore}% match
        </span>
      </div>

      {/* Applied date */}
      <p className="text-xs text-brand-foreground-secondary">
        Applied {format(new Date(card.appliedAt), "MMM d, yyyy")}
      </p>

      {/* Status move select */}
      <div className="mt-auto pt-1">
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              onMove(card.id, e.target.value);
            }
          }}
          disabled={isMoving}
          className={cn(
            "w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs",
            "focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "text-brand-foreground",
          )}
        >
          <option value="" disabled>
            {isMoving ? "Moving..." : "Move to..."}
          </option>
          {otherStatuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
