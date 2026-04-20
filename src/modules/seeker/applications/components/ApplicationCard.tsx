import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MoreVertical, Building2 } from "lucide-react";
import { ApplicationStatus } from "@/constants/enums";
import { cn } from "@/lib/utils";
import type { SeekerApplicationItem } from "../types/application.types";
import { Button } from "@/components/ui/button";

interface ApplicationCardProps {
  application: SeekerApplicationItem;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center p-2 border border-slate-100 text-primary font-bold overflow-hidden">
          {application.companyLogoUrl ? (
            <Image
              src={application.companyLogoUrl}
              alt={application.companyName}
              width={56}
              height={56}
              className="w-full h-full object-contain"
            />
          ) : (
            <Building2 className="w-6 h-6" />
          )}
        </div>
        <Button variant="ghost" size="icon" className="px-2">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1">
        <Link href={`/jobs/${application.jobId}`}>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">
            {application.jobTitle}
          </h3>
        </Link>
        <p className="text-slate-500 text-sm mb-4">{application.companyName}</p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
        <StatusBadge status={application.status} />
        <span className="text-xs text-slate-400 font-medium">
          Applied {application.appliedAt}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  let badgeClasses = "";
  let dotClasses = "";
  let label: string = status;

  switch (status) {
    case ApplicationStatus.INTERVIEW:
      badgeClasses = "bg-primary/10 text-primary";
      dotClasses = "bg-primary";
      label = "Interview";
      break;
    case ApplicationStatus.REVIEWING:
      badgeClasses = "bg-blue-100 text-blue-700";
      dotClasses = "bg-blue-500";
      label = "Under Review";
      break;
    case ApplicationStatus.APPLIED:
      badgeClasses = "bg-slate-100 text-slate-600";
      dotClasses = "bg-slate-400";
      label = "Applied";
      break;
    case ApplicationStatus.OFFER:
      badgeClasses = "bg-amber-100 text-amber-700";
      dotClasses = "bg-amber-500";
      label = "Offer Received";
      break;
    case ApplicationStatus.HIRED:
      badgeClasses = "bg-brand-primary-light text-brand-primary";
      dotClasses = "bg-brand-primary";
      label = "Hired";
      break;
    case ApplicationStatus.REJECTED:
      badgeClasses = "bg-red-100 text-red-600";
      dotClasses = "bg-red-500";
      label = "Not Selected";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
        badgeClasses,
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", dotClasses)}></span>
      {label}
    </span>
  );
}
