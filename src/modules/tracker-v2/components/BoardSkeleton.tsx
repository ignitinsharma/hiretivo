"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineStage } from "@/constants/enums";

const COLORS: Record<string, string> = {
  [PipelineStage.NOT_APPLIED]: "bg-gray-400",
  [PipelineStage.APPLIED]: "bg-blue-500",
  [PipelineStage.INTERVIEWING]: "bg-cyan-500",
  [PipelineStage.OFFER]: "bg-amber-500",
  [PipelineStage.REJECTED]: "bg-red-500",
};

const LABELS: Record<string, string> = {
  [PipelineStage.NOT_APPLIED]: "Not Applied Yet",
  [PipelineStage.APPLIED]: "Applied",
  [PipelineStage.INTERVIEWING]: "Interviewing",
  [PipelineStage.OFFER]: "Offer",
  [PipelineStage.REJECTED]: "Rejected",
};

const COLUMNS = [
  PipelineStage.NOT_APPLIED,
  PipelineStage.APPLIED,
  PipelineStage.INTERVIEWING,
  PipelineStage.OFFER,
  PipelineStage.REJECTED,
];

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((stage) => (
        <div
          key={stage}
          className="shrink-0 w-[280px] sm:w-[300px] lg:w-[320px] flex flex-col"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-1 h-6 rounded-pill ${COLORS[stage]}`} />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded-pill" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
