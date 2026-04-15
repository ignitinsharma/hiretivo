"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ApplicationStatus } from "@/constants/enums";

interface RecentApplicant {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  position: string;
  matchScore: number;
  appliedDate: string;
  status: ApplicationStatus;
  primaryRole?: string | null;
}

const APPLICANT_STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-slate-100 text-slate-700",
  REVIEWING: "bg-blue-100 text-blue-700",
  INTERVIEW: "bg-primary/10 text-primary",
  OFFER: "bg-amber-100 text-amber-700",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "New",
  REVIEWING: "Reviewing",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

function getMatchLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  return "Partial";
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ApplicantRow({ applicant }: { applicant: RecentApplicant }) {
  const initials = applicant.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <Link
      href={`/recruiter/applications?applicant=${applicant.id}`}
      className="flex items-center gap-4 hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
    >
      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-semibold shrink-0">
        {applicant.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={applicant.avatar}
            alt={applicant.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{applicant.name}</p>
        <p className="text-xs text-slate-500 truncate">
          for {applicant.position}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full mb-1",
            APPLICANT_STATUS_STYLES[applicant.status] ??
              "bg-slate-100 text-slate-600",
          )}
        >
          {STATUS_LABELS[applicant.status] ?? applicant.status}
        </span>
        <span className="text-[10px] font-medium text-primary">
          {getMatchLabel(applicant.matchScore)} · {applicant.matchScore}%
        </span>
      </div>
    </Link>
  );
}

function ApplicantSkeleton() {
  return (
    <div className="flex items-center gap-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-slate-100" />
      <div className="flex-1">
        <div className="h-4 bg-slate-100 rounded w-24 mb-1" />
        <div className="h-3 bg-slate-100 rounded w-32" />
      </div>
    </div>
  );
}

export function RecentApplicantsList() {
  const [applicants, setApplicants] = useState<RecentApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recruiter/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setApplicants(data.recentApplicants ?? []);
      })
      .catch(() => {
        setApplicants([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-6 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Recent Applicants</h2>
        <Link
          href="/recruiter/applications"
          className="text-primary font-semibold text-sm hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="p-6 space-y-6">
        {isLoading ? (
          <>
            <ApplicantSkeleton />
            <ApplicantSkeleton />
            <ApplicantSkeleton />
          </>
        ) : applicants.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No applicants yet.{" "}
            <Link
              href="/recruiter/jobs"
              className="text-primary hover:underline"
            >
              Post a job
            </Link>{" "}
            to get started.
          </p>
        ) : (
          applicants.map((applicant) => (
            <ApplicantRow key={applicant.id} applicant={applicant} />
          ))
        )}
      </div>
    </div>
  );
}
