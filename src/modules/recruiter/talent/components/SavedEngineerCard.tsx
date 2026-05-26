"use client";

import { Button } from "@/components/ui/button";
import { BookmarkCheck, Mail, Linkedin, Github, FileText } from "lucide-react";
import { isUnlocked, type TalentEngineer } from "../types/talent.types";
import { useSaveEngineer } from "../queries/use-talent-pool";
import { format } from "date-fns";

interface SavedEngineerCardProps {
  engineer: TalentEngineer;
}

/*
 * SavedEngineerCard
 * Simplified card for the saved engineers page.
 * No unlock button — just shows saved state + PII links if unlocked.
 */
export function SavedEngineerCard({ engineer }: SavedEngineerCardProps) {
  const { mutate: save, isPending: saving } = useSaveEngineer();
  const unlocked = isUnlocked(engineer);

  const handleUnsave = () => {
    save({ engineerId: engineer.id, save: false });
  };

  return (
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
        <span>{engineer.timezoneOverlapHours}h live overlap</span>
      </div>

      {/* Unlocked PII */}
      {unlocked && (
        <div className="flex flex-col gap-1 text-sm border-t border-brand-border pt-3">
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
        {unlocked && engineer.email && (
          <Button variant="secondary" size="sm" asChild className="flex-1">
            <a href={`mailto:${engineer.email}`}>
              <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
            </a>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnsave}
          disabled={saving}
          className="flex items-center gap-1"
        >
          <BookmarkCheck className="h-4 w-4 text-brand-primary" />
          Saved
        </Button>
      </div>
    </div>
  );
}
