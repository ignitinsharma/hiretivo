import { Briefcase, Clock3, Github, Globe, Linkedin, MapPin, Star, TrendingUp, Twitter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationStatus } from "@/constants/enums";
import { getStageLabel } from "@/lib/application-pipeline";

import type { CandidateApplication } from "../types";
import { getExperienceLabel, getScoreColor } from "../utils";
import { InterviewPanel } from "./InterviewPanel";

const STAGE_OPTIONS: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

interface SidebarPanelProps {
  application: CandidateApplication;
  profileStrength: number;
  onStageChange: (value: ApplicationStatus) => void;
  isUpdatingStage: boolean;
  cancelConfirming: boolean;
  isCancellingInterview: boolean;
  onStartCancelInterview: () => void;
  onAbortCancelInterview: () => void;
  onConfirmCancelInterview: (interviewId: string) => void;
  onScheduleInterview: (applicationId: string, interviewId?: string | null) => void;
}

function CircularProgress({ score }: { score: number }) {
  const radius = 34;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-20 w-20">
      <svg className="-rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} strokeWidth="6" className="fill-none text-brand-border" stroke="currentColor" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth="6"
          className="fill-none text-brand-primary"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-primary">{score}%</span>
    </div>
  );
}

export function SidebarPanel({
  application,
  profileStrength,
  onStageChange,
  isUpdatingStage,
  cancelConfirming,
  isCancellingInterview,
  onStartCancelInterview,
  onAbortCancelInterview,
  onConfirmCancelInterview,
  onScheduleInterview,
}: SidebarPanelProps) {
  const profile = application.candidateProfile;
  const links = [
    { href: profile?.websiteUrl, label: "Website", Icon: Globe },
    { href: profile?.linkedinUrl, label: "LinkedIn", Icon: Linkedin },
    { href: profile?.githubUrl, label: "GitHub", Icon: Github },
    { href: profile?.twitterUrl, label: "Twitter", Icon: Twitter },
  ].filter((item): item is { href: string; label: string; Icon: typeof Globe } => Boolean(item.href));

  return (
    <aside className="space-y-4">
      <article className="overflow-hidden rounded-xl border border-brand-border bg-white">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-foreground-secondary">Match Score</p>
              <p className={`mt-1 text-4xl font-bold ${getScoreColor(application.matchScore)}`}>
                {application.matchScore}%
              </p>
            </div>
            <CircularProgress score={application.matchScore} />
          </div>
        </div>
        <div className="border-t border-brand-border p-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-brand-surface p-2"><Briefcase className="h-4 w-4 text-brand-primary" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-foreground-secondary">Role</p>
                <p className="text-sm font-semibold text-brand-foreground">{profile?.primaryRole ?? application.jobTitle}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-brand-surface p-2"><MapPin className="h-4 w-4 text-brand-primary" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-foreground-secondary">Location</p>
                <p className="text-sm font-semibold text-brand-foreground">{profile?.location ?? "Location not provided"}</p>
              </div>
            </div>
            {profile?.yearsExperience != null ? (
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-surface p-2"><Clock3 className="h-4 w-4 text-brand-primary" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-foreground-secondary">Experience</p>
                  <p className="text-sm font-semibold text-brand-foreground">{getExperienceLabel(profile.yearsExperience)}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      <article className="rounded-xl border border-brand-border bg-brand-surface p-4">
        <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-foreground">
          <Star className="h-4 w-4 text-brand-primary" />
          Profile Strength
        </p>
        <span className="text-sm font-semibold text-brand-foreground">{profileStrength}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-border">
        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${profileStrength}%` }} />
      </div>
      <p className="mt-2 text-xs text-brand-foreground-muted">Keep going! You’re almost there.</p>
    </article>

      <article className="rounded-xl border border-brand-border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-foreground">
            <TrendingUp className="h-4 w-4 text-brand-primary" />
            Move Forward
          </p>
        </div>
        <Select
          value={application.status}
          onValueChange={(value) => onStageChange(value as ApplicationStatus)}
          disabled={isUpdatingStage}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {getStageLabel(stage)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </article>

      {links.length > 0 ? (
        <article className="rounded-xl border border-brand-border bg-white p-3">
          <div className="space-y-2">
            {links.map(({ href, label, Icon }) => (
              <Button key={label} variant="secondary" size="sm" className="w-full justify-between" asChild>
                <a href={href} target="_blank" rel="noreferrer">
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <span className="text-xs text-brand-foreground-secondary">open</span>
                </a>
              </Button>
            ))}
          </div>
        </article>
      ) : null}

      <InterviewPanel
        application={application}
        cancelConfirming={cancelConfirming}
        isCancelling={isCancellingInterview}
        onStartCancel={onStartCancelInterview}
        onAbortCancel={onAbortCancelInterview}
        onConfirmCancel={onConfirmCancelInterview}
        onSchedule={onScheduleInterview}
      />
    </aside>
  );
}
