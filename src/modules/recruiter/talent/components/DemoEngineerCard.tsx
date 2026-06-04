"use client";

import type { ReactElement } from "react";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import type { DemoEngineerProfile } from "@/constants/demo-engineers";

const DEMO_CARD_CLASS = "rounded-xl border border-brand-border bg-white p-5";
const MUTED_TEXT_CLASS = "text-sm font-semibold text-brand-foreground-muted";
const MAX_CARD_SKILLS = 4;

interface DemoEngineerCardProps {
  profile: DemoEngineerProfile;
  onUpgrade: () => void;
}

/*
 * DemoEngineerCard
 * Renders a static demo engineer profile card for FREE-plan recruiters.
 * Full name is intentionally visible (contrast with blurred real cards) — per D-02.
 * "Preview" chip in top-right signals this is a sample, not a real unlocked engineer.
 * "Unlock Now" button opens TalentUpgradeModal — no profile dialog, no save — per D-08.
 * @param profile - DemoEngineerProfile static data
 * @param onUpgrade - Callback to open TalentUpgradeModal
 */
export function DemoEngineerCard({ profile, onUpgrade }: DemoEngineerCardProps): ReactElement {
  const visibleSkills = profile.skills.slice(0, MAX_CARD_SKILLS);
  const hiddenSkillCount = Math.max(profile.skills.length - MAX_CARD_SKILLS, 0);

  return (
    <article className={`${DEMO_CARD_CLASS} relative flex h-full min-h-64 flex-col`}>
      {/* Preview chip — per D-03: text-xs, bg-brand-surface, border-brand-border */}
      <span className="absolute right-4 top-4 rounded-md border border-brand-border bg-brand-surface px-2 py-0.5 text-xs font-semibold text-brand-foreground-muted">
        Preview
      </span>

      {/* Header: avatar + name + headline */}
      <div className="mb-4 flex min-h-14 items-start justify-between gap-3 pr-16">
        <div className="flex min-w-0 items-center gap-3">
          <InitialsAvatar
            name={profile.name}
            fallbackSeed={profile.name}
            size="lg"
          />
          <div className="min-w-0">
            {/* Full name visible — per D-02 — contrast with blurred real cards */}
            <h2 className="truncate text-lg font-bold capitalize leading-tight tracking-tight text-brand-foreground">
              {profile.name}
            </h2>
            <p className={MUTED_TEXT_CLASS}>{profile.headline}</p>
          </div>
        </div>
      </div>

      {/* Hiretivo Score + seeking status dot */}
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md border border-brand-border bg-brand-surface px-2 py-0.5 text-xs font-bold text-brand-foreground">
          {profile.hiretivoScore}/100
        </span>
        <span
          className={`h-2 w-2 rounded-full ${profile.seekingStatus === "ACTIVELY_LOOKING" ? "bg-green-500" : "bg-yellow-400"}`}
          aria-label={profile.seekingStatus === "ACTIVELY_LOOKING" ? "Actively looking" : "Open to offers"}
        />
        <span className="text-xs text-brand-foreground-muted">
          {profile.seekingStatus === "ACTIVELY_LOOKING" ? "Actively looking" : "Open to offers"}
        </span>
      </div>

      {/* Skills */}
      <div className="mb-4 flex min-h-16 flex-wrap content-start gap-2">
        {visibleSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-foreground"
          >
            {skill}
          </span>
        ))}
        {hiddenSkillCount > 0 && (
          <span className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-brand-foreground-muted">
            +{hiddenSkillCount}
          </span>
        )}
      </div>

      {/* Meta grid: salary, availability, experience, timezone */}
      <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-semibold text-brand-foreground-muted">
        <span>{profile.salaryRange}</span>
        <span>{profile.availability}</span>
        <span>{profile.yearsExperience} {profile.yearsExperience === 1 ? "year" : "years"}</span>
        <span>{profile.timezoneOverlap}</span>
      </div>

      {/* CTA: Unlock Now only — no email, no save — per D-08 */}
      <div className="mt-auto">
        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={onUpgrade}
        >
          Unlock Now
        </Button>
      </div>
    </article>
  );
}
