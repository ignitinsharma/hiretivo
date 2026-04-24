import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { JobListItem } from "@/modules/jobs/types/job.types";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: JobListItem;
  onApply?: () => void;
  variant?: "default" | "compact";
}

export function JobCard({ job, onApply, variant = "default" }: JobCardProps) {
  const isCompact = variant === "compact";

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
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
        {job.matchScore !== undefined && (
          <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            {job.matchScore}% Match
          </span>
        )}
      </div>

      <div className="flex-1">
        <Link href={`/jobs/${job.id}`}>
          <h3 className="text-slate-900 font-bold text-lg leading-tight group-hover:text-primary transition-colors">
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
        <Button onClick={onApply} variant="subtle" size="sm">
          Apply Now
        </Button>
      </div>
    </div>
  );
}
