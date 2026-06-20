import React, { useState } from "react";
import { AlertTriangle, Briefcase, Calendar, Check, ChevronDown, Clock3, Eye, Gift, MapPin, Send, Star, TrendingUp, UserCheck, XCircle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApplicationStatus } from "@/constants/enums";
import { cn } from "@/lib/utils";

import type { CandidateApplication } from "../types";
import { getExperienceLabel } from "../utils";
import { InterviewPanel } from "./InterviewPanel";
import { SkillsMatchCard } from "./SkillsMatchCard";

/*
 * STAGE_CONFIG
 * Ordered list of application stages with display label, icon, and danger flag.
 * Used for the "Move Forward" dropdown in the candidate drawer sidebar.
 */
const STAGE_CONFIG: {
  status: ApplicationStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}[] = [
  { status: ApplicationStatus.APPLIED,   label: "Applied",       icon: Send },
  { status: ApplicationStatus.REVIEWING, label: "Under Review",  icon: Eye },
  { status: ApplicationStatus.INTERVIEW, label: "Interview",     icon: Calendar },
  { status: ApplicationStatus.OFFER,     label: "Offer Received", icon: Gift },
  { status: ApplicationStatus.HIRED,     label: "Hired",         icon: UserCheck },
  { status: ApplicationStatus.REJECTED,  label: "Not Selected",  icon: XCircle, danger: true },
];

interface SidebarPanelProps {
  application: CandidateApplication;
  profileStrength: number;
  matchedSkills: string[];
  missingSkills: string[];
  totalSkills: number;
  onStageChange: (value: ApplicationStatus) => void;
  isUpdatingStage: boolean;
  cancelConfirming: boolean;
  isCancellingInterview: boolean;
  onStartCancelInterview: () => void;
  onAbortCancelInterview: () => void;
  onConfirmCancelInterview: (interviewId: string) => void;
  onScheduleInterview: (applicationId: string, interviewId?: string | null) => void;
}

/*
 * SidebarPanel
 * Right-hand sidebar in the candidate drawer: role info, profile strength,
 * stage selector (Move Forward), skills match, and interview actions.
 */
export function SidebarPanel({
  application,
  profileStrength,
  matchedSkills,
  missingSkills,
  totalSkills,
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
  const currentStage = STAGE_CONFIG.find((s) => s.status === application.status);

  /* Stage awaiting confirmation — null when no dialog is open. */
  const [pendingStage, setPendingStage] = useState<ApplicationStatus | null>(null);
  const pendingConfig = STAGE_CONFIG.find((s) => s.status === pendingStage);
  const isPendingRejection = pendingStage === ApplicationStatus.REJECTED;

  /*
   * requestStageChange
   * Opens the confirmation dialog for a stage selection; no-ops if the
   * candidate is already in that stage.
   */
  const requestStageChange = (status: ApplicationStatus) => {
    if (status === application.status) return;
    setPendingStage(status);
  };

  /*
   * confirmStageChange
   * Commits the pending stage change (fires the email + advances the stage)
   * and closes the dialog.
   */
  const confirmStageChange = () => {
    if (pendingStage) onStageChange(pendingStage);
    setPendingStage(null);
  };

  return (
    <aside className="space-y-4">
      <article className="overflow-hidden rounded-xl border border-brand-border bg-white">
        <div className="p-4">
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
        <p className="mt-2 text-xs text-brand-foreground-muted">Keep going! You&apos;re almost there.</p>
      </article>

      <article className="rounded-xl border border-brand-border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-foreground">
            <TrendingUp className="h-4 w-4 text-brand-primary" />
            Move Forward
          </p>
        </div>

        {/* Stage dropdown — icons per stage, red styling for Not Selected */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isUpdatingStage}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                currentStage?.danger && "border-red-200 text-red-600",
              )}
            >
              <span className="flex items-center gap-2">
                {currentStage && (
                  <currentStage.icon
                    className={cn("h-4 w-4 shrink-0", currentStage.danger ? "text-red-500" : "text-brand-foreground-muted")}
                  />
                )}
                <span>{currentStage?.label ?? "Select stage"}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-48 p-1">
            {STAGE_CONFIG.map(({ status, label, icon: Icon, danger }) => {
              const isSelected = application.status === status;
              return (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => requestStageChange(status)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    isSelected && "font-semibold",
                    danger
                      ? "text-red-600 focus:bg-red-50 focus:text-red-700"
                      : "focus:bg-brand-surface focus:text-brand-foreground",
                  )}
                >
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : (
                    <Icon className={cn("h-4 w-4 shrink-0", danger ? "text-red-400" : "text-brand-foreground-muted")} />
                  )}
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </article>

      {/* Confirm dialog — stage changes are irreversible and email the candidate */}
      <AlertDialog open={pendingStage !== null} onOpenChange={(open) => { if (!open) setPendingStage(null); }}>
        <AlertDialogContent className="rounded-xl border-brand-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-brand-foreground">
              {isPendingRejection && <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />}
              Move candidate to &ldquo;{pendingConfig?.label}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-brand-foreground-muted">
              {isPendingRejection ? (
                <>
                  This marks <span className="font-semibold text-brand-foreground">{application.candidateName}</span> as
                  Not Selected and emails them a rejection. This can&apos;t be undone.
                </>
              ) : (
                <>
                  <span className="font-semibold text-brand-foreground">{application.candidateName}</span> will be
                  notified by email. This can&apos;t be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStageChange}
              className={cn(
                isPendingRejection
                  ? "bg-brand-danger text-white hover:bg-brand-danger/90"
                  : "bg-brand-primary text-white hover:bg-brand-primary-dk",
              )}
            >
              {isPendingRejection ? "Mark Not Selected" : `Move to ${pendingConfig?.label}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SkillsMatchCard
        matchedSkills={matchedSkills}
        missingSkills={missingSkills}
        totalSkills={totalSkills}
        applicationId={application.id}
      />

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
