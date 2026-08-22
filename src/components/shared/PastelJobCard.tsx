"use client";

import { Building2 } from "lucide-react";
import { getPastelColor } from "@/lib/jobs/pastel-colors";
import { MatchRing } from "@/components/shared/MatchRing";
import type { JobListItem } from "@/modules/jobs/types/job.types";

interface PastelJobCardProps {
  job: JobListItem;
  index: number;
  onApply?: () => void;
  onPass?: () => void;
  isPassing?: boolean;
  className?: string;
}

/*
 * PastelJobCard
 * Tsenta-parity card for Dashboard single row + Browse grid.
 * Pastel bg via index % 5, top line location + date + match ring, title, skill pills, footer logo + Pass/Apply.
 */
export function PastelJobCard({ job, index, onApply, onPass, isPassing, className }: PastelJobCardProps) {
  const bg = getPastelColor(index);
  const posted = job.postedAt ?? "Recently";
  const location = job.location ?? "Remote";
  const skills = (job.tags ?? job.matchedSkillNames ?? []).slice(0, 4);
  const companyInitial = job.companyName.charAt(0).toUpperCase();

  return (
    <div
      className={`flex flex-col rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-150 h-[285px] ${className ?? "shrink-0 w-[280px] sm:w-[300px] snap-start"}`}
      style={{ backgroundColor: bg }}
    >
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-brand-foreground truncate">{location}</p>
            <p className="text-[11px] text-brand-foreground-muted">{posted}</p>
          </div>
          {job.matchScore !== undefined && job.matchScore !== null ? (
            <div className="shrink-0">
              <MatchRing score={job.matchScore} size={42} strokeWidth={3} />
            </div>
          ) : (
            <span className="shrink-0 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold">0% MATCH</span>
          )}
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-brand-foreground line-clamp-2 min-h-[44px]">{job.title}</h3>

        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="rounded-md bg-white/80 border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-brand-foreground">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <div className="h-6" />
        )}
      </div>

      <div className="bg-white flex items-center justify-between px-3 py-2.5 border-t border-gray-200">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 shrink-0 rounded-md border border-gray-200 bg-brand-surface flex items-center justify-center overflow-hidden">
            {job.companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.companyLogoUrl} alt={job.companyName} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[11px] font-bold text-brand-foreground-muted">{companyInitial}</span>
            )}
          </div>
          <span className="text-xs font-semibold truncate max-w-[80px]">{job.companyName}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onPass && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPass(); }}
              disabled={isPassing}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-brand-foreground hover:bg-gray-50 disabled:opacity-50"
            >
              Pass
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onApply?.(); }}
            className="rounded-full bg-[#0a0a0a] px-3.5 py-1 text-xs font-semibold text-white hover:bg-black"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function PastelCardSkeleton({ index, className }: { index: number; className?: string }) {
  const bg = getPastelColor(index);
  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 overflow-hidden animate-pulse h-[285px] ${className ?? "shrink-0 w-[280px] sm:w-[300px]"}`} style={{ backgroundColor: bg }}>
      <div className="p-4 flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-2.5 w-16 rounded bg-gray-200" />
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200" />
        </div>
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-2/3 rounded bg-gray-200" />
        <div className="flex gap-1.5">
          <div className="h-5 w-14 rounded-md bg-gray-200" />
          <div className="h-5 w-14 rounded-md bg-gray-200" />
          <div className="h-5 w-14 rounded-md bg-gray-200" />
        </div>
      </div>
      <div className="bg-white flex items-center justify-between px-3 py-2.5 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-6 w-12 rounded-full bg-gray-200" />
          <div className="h-6 w-14 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
