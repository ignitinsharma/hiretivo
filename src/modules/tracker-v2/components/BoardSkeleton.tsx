"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineStage } from "@/constants/enums";

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
          className="flex w-[280px] shrink-0 flex-col rounded-xl border border-brand-border bg-white sm:w-[300px] lg:w-[320px]"
        >
          <div className="px-4 pb-3 pt-3.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="mt-2.5 h-0.5 w-full rounded-pill" />
          </div>
          <div className="flex flex-col gap-2 px-3 pb-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
