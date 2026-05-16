"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Lock, Mail, Linkedin, Github, FileText } from "lucide-react";
import { isUnlocked, type TalentEngineer } from "../types/talent.types";
import { useUnlockEngineer, useSaveEngineer } from "../queries/use-talent-pool";
import { UpgradeModal } from "./UpgradeModal";
import { format } from "date-fns";

interface EngineerCardProps {
  engineer: TalentEngineer;
  isFreePlan: boolean;
  quotaExhausted: boolean;
  quotaResetAt?: string | null;
}

/*
 * EngineerCard
 * Renders one of 3 states based on unlock status and plan:
 * State 1 — Locked: blurred name, Unlock + Save buttons
 * State 2 — Unlocked: full PII, Email buttons
 * State 3 — Quota exhausted: Unlock button grayed with tooltip
 * FREE plan: unlock attempt opens UpgradeModal instead of calling API
 */
export function EngineerCard({ engineer, isFreePlan, quotaExhausted, quotaResetAt }: EngineerCardProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { mutate: unlock, isPending: unlocking } = useUnlockEngineer();
  const { mutate: save, isPending: saving } = useSaveEngineer();
  const unlocked = isUnlocked(engineer);

  const handleUnlock = () => {
    if (isFreePlan) {
      setUpgradeModalOpen(true);
      return;
    }
    if (quotaExhausted) return;
    unlock(engineer.id);
  };

  const handleSave = () => {
    save({ engineerId: engineer.id, save: !engineer.isSaved });
  };

  return (
    <>
      <div className="rounded-xl border border-brand-border bg-white p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-brand-foreground">
                {unlocked ? engineer.fullName : `${engineer.firstName} ${engineer.lastInitial}.`}
              </h3>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-brand-primary-foreground">
                ✓ Verified
              </span>
            </div>
            <p className="text-sm text-brand-foreground-muted">{engineer.role}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-brand-foreground-secondary">Score</span>
            <span className="font-bold text-brand-foreground">{engineer.hiretivoScore}/100</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-foreground-muted">
          <span>{engineer.yearsExperience} yrs exp</span>
          <span>${engineer.salaryMinUsd.toLocaleString()}–${engineer.salaryMaxUsd.toLocaleString()} /yr</span>
          <span>{engineer.timezoneOverlapHours}h overlap</span>
          {engineer.availableFrom && <span>Available {format(new Date(engineer.availableFrom), "MMM d")}</span>}
        </div>

        {/* Skills */}
        {engineer.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {engineer.skills.slice(0, 6).map((skill) => (
              <span key={skill} className="rounded-lg border border-brand-border bg-brand-surface px-2 py-0.5 text-xs text-brand-foreground">
                {skill}
              </span>
            ))}
            {engineer.skills.length > 6 && (
              <span className="text-xs text-brand-foreground-secondary">+{engineer.skills.length - 6}</span>
            )}
          </div>
        )}

        {/* Unlocked PII */}
        {unlocked && (
          <div className="flex flex-col gap-1 text-sm border-t border-brand-border pt-3">
            <a href={`mailto:${engineer.email}`} className="flex items-center gap-1.5 text-brand-primary hover:underline">
              <Mail className="h-3.5 w-3.5" /> {engineer.email}
            </a>
            {engineer.githubUrl && (
              <a href={engineer.githubUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1.5 text-brand-foreground-muted hover:text-brand-foreground">
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
            )}
            {engineer.linkedinUrl && (
              <a href={engineer.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1.5 text-brand-foreground-muted hover:text-brand-foreground">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
            )}
            {engineer.resumeUrl && (
              <a href={engineer.resumeUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1.5 text-brand-foreground-muted hover:text-brand-foreground">
                <FileText className="h-3.5 w-3.5" /> Resume
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {!unlocked ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUnlock}
                disabled={(quotaExhausted && !isFreePlan) || unlocking}
                title={quotaExhausted && !isFreePlan && quotaResetAt ? `Quota exhausted — resets ${format(new Date(quotaResetAt), "MMM d")}` : undefined}
                className="flex-1"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                {unlocking ? "Unlocking…" : "Unlock Profile"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={saving}
                aria-label={engineer.isSaved ? "Unsave engineer" : "Save engineer"}
              >
                {engineer.isSaved ? <BookmarkCheck className="h-4 w-4 text-brand-primary" /> : <Bookmark className="h-4 w-4" />}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" asChild className="flex-1">
                <a href={`mailto:${engineer.email}`}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={saving}
                aria-label={engineer.isSaved ? "Unsave engineer" : "Save engineer"}
              >
                {engineer.isSaved ? <BookmarkCheck className="h-4 w-4 text-brand-primary" /> : <Bookmark className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>
      </div>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        engineerPreview={{ firstName: engineer.firstName, lastInitial: engineer.lastInitial, hiretivoScore: engineer.hiretivoScore }}
      />
    </>
  );
}
