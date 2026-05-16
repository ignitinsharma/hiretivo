"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

import { Lock } from "lucide-react";

import { UserRole, VerificationStatus } from "@/constants/enums";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/use-ui-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaveJobButton } from "@/modules/jobs/components/SaveJobButton";
import { ApplyButton } from "@/modules/jobs/components/ApplyButton";

interface RecommendedJob {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  salaryRange: string;
  matchLabel: string | null;
}

interface JobDetailSidebarProps {
  job: {
    id: string;
    title: string;
    companyName: string;
    publishedAt: string | null;
    applyType: string;
    externalApplyUrl: string | null;
  };
  matchScore: number | null;
  matchBreakdown: Array<{
    skillId: string;
    skillName: string;
    isMatch: boolean;
  }> | null;
  isAuth: boolean;
  userRole: string | null;
  engineerVerificationStatus: VerificationStatus | null;
  recommendedJobs: RecommendedJob[];
}

export function JobDetailSidebar({
  job,
  matchScore,
  matchBreakdown,
  isAuth,
  userRole,
  engineerVerificationStatus,
  recommendedJobs,
}: JobDetailSidebarProps) {
  const { openApplyModal } = useUIStore();

  return (
    <aside className="w-full lg:w-80 space-y-6 lg:sticky lg:top-24 shrink-0">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Quick Apply</h3>
          <span className="px-2 py-1 bg-gray-100 text-black text-[10px] font-bold uppercase rounded leading-none">
            Actively Hiring
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Posted
            </p>
            <p className="text-sm font-bold">
              {job.publishedAt
                ? new Date(job.publishedAt).toLocaleDateString()
                : "Recently"}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Company
            </p>
            <p className="text-sm font-bold">{job.companyName}</p>
          </div>
        </div>

        <div className="space-y-3">
          <ApplyButton
            jobId={job.id}
            verificationStatus={isAuth ? engineerVerificationStatus : null}
            userRole={userRole}
            onApply={() =>
              openApplyModal(
                job.id,
                job.title,
                job.companyName,
                job.applyType,
                job.externalApplyUrl,
              )
            }
            onLoginRequired={() =>
              openApplyModal(
                job.id,
                job.title,
                job.companyName,
                job.applyType,
                job.externalApplyUrl,
              )
            }
            className="w-full py-3"
          />
          <SaveJobButton
            jobId={job.id}
            isAuth={isAuth}
            userRole={userRole}
            fullWidth
            className="w-full py-3"
            unsavedLabel="Save for later"
          />
        </div>
      </div>

      {/* Match Score Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Match Score
        </h3>

        {isAuth &&
        userRole === UserRole.SEEKER &&
        matchBreakdown &&
        matchBreakdown.length > 0 ? (
          <>
            {matchScore !== null && (
              <div className="text-4xl font-extrabold text-primary mb-4">
                {matchScore}%
              </div>
            )}
            <div className="space-y-2">
              {matchBreakdown.map((skill) => (
                <div
                  key={skill.skillId}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-slate-700">
                    {skill.skillName}
                  </span>
                  <Badge
                    className={cn(
                      "text-xs",
                      skill.isMatch
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                    )}
                  >
                    {skill.isMatch ? "Match" : "Missing"}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="relative">
            <div className="blur-sm select-none">
              <div className="text-4xl font-extrabold text-primary mb-4">
                85%
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">React</span>
                  <Badge>Match</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">TypeScript</span>
                  <Badge>Match</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Node.js</span>
                  <Badge>Missing</Badge>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-lg">
              <Lock className="w-6 h-6 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Sign in to see your match
              </p>
              <Link href="/seeker/login">
                <Button variant="default" size="sm" className="mt-2 text-xs">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Compare Similar</h3>
          <span className="text-xs font-medium text-primary">
            {recommendedJobs.length} Available
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="p-4 bg-primary/5 border-l-4 border-primary">
            <div className="flex gap-3 mb-2">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {job.companyName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">
                  {job.title}
                </p>
                <p className="text-[10px] text-slate-500">{job.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded">
                Current
              </span>
            </div>
          </div>

          {recommendedJobs.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              No similar jobs available right now.
            </p>
          )}

          {recommendedJobs.map((similarJob) => (
            <Link
              key={similarJob.id}
              href={`/jobs/${similarJob.id}`}
              className="p-4 block hover:bg-slate-50 transition-colors group"
            >
              <div className="flex gap-3 mb-2">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                  {similarJob.companyLogoUrl ? (
                    <Image
                      src={similarJob.companyLogoUrl}
                      alt={`${similarJob.companyName} logo`}
                      width={32}
                      height={32}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    similarJob.companyName.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-primary line-clamp-1 transition-colors">
                    {similarJob.title}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {similarJob.companyName} • {similarJob.salaryRange}
                  </p>
                </div>
              </div>
              {similarJob.matchLabel && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">
                    {similarJob.matchLabel}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="p-4">
          <Button variant="ghost" className="w-full text-xs" asChild>
            <Link href="/jobs">View All Jobs</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
