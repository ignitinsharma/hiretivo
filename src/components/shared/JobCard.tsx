import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobListItem } from "@/modules/jobs/types/job.types";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: JobListItem;
  isSaved?: boolean;
  onApply?: () => void;
  onToggleSave?: () => void;
  variant?: "default" | "compact";
}

export function JobCard({
  job,
  isSaved = false,
  onApply,
  onToggleSave,
  variant = "default",
}: JobCardProps) {
  const isCompact = variant === "compact";
  const saveLabel = isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`;

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-5 shadow-[rgba(89,82,229,0.12)_0px_0px_0px_1px]">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-lg bg-slate-50 p-2 border border-slate-100 flex items-center justify-center overflow-hidden">
          {job.companyLogoUrl ? (
            <Image
              src={job.companyLogoUrl}
              alt={`${job.companyName} logo`}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-xl font-bold text-slate-400">
              {job.companyName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {job.matchScore !== undefined && (
            <span className="rounded-full bg-[rgba(89,82,229,0.1)] px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#5952e5]">
              {job.matchScore}% Match
            </span>
          )}
          {onToggleSave && (
            <button
              type="button"
              aria-label={saveLabel}
              title={saveLabel}
              onClick={onToggleSave}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95",
                isSaved
                  ? "border-[#5952e5] bg-[rgba(89,82,229,0.1)] text-[#5952e5]"
                  : "border-[rgba(14,15,12,0.12)] bg-white text-[#454745]",
              )}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        <Link href={`/jobs/${job.id}`}>
          <h3 className="text-lg font-semibold leading-[1.25] text-[#0e0f0c] transition-colors group-hover:text-[#5952e5] [font-feature-settings:'calt']">
            {job.title}
          </h3>
        </Link>
        <p className="text-slate-500 text-sm mt-1">
          {job.companyName} • {job.location}
        </p>
      </div>

      {job.missingSkillsHint && (
        <p className="mt-2 text-xs text-amber-600 font-medium truncate">
          {job.missingSkillsHint}
        </p>
      )}

      <div
        className={cn(
          "mt-4 pt-4 border-t border-slate-100 flex items-center justify-between",
          isCompact && "mt-3 pt-3",
        )}
      >
        <span className="text-slate-700 font-semibold text-sm">
          {job.salaryRange}
        </span>
        <Button onClick={onApply} variant="subtle" size="sm" disabled={!onApply}>
          Apply Now
        </Button>
      </div>
    </div>
  );
}
