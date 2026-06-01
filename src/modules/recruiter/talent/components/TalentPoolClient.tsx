"use client";

import { Mail, Search, X } from "lucide-react";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEMO_ENGINEERS, DEMO_THRESHOLD } from "@/constants/demo-engineers";
import type { DemoEngineerProfile } from "@/constants/demo-engineers";
import { useFetchTalent } from "@/modules/recruiter/talent/queries/use-fetch-talent";
import { formatProfileLabel } from "@/modules/recruiter/talent/utils/format-profile-label";
import type { TalentListItem } from "@/modules/recruiter/talent/types/talent.types";

import { DemoEngineerCard } from "./DemoEngineerCard";
import { TalentProfileDialog } from "./TalentProfileDialog";
import { TalentUpgradeModal } from "./TalentUpgradeModal";

const TALENT_CARD_CLASS = "rounded-xl border border-brand-border bg-white p-5";
const MUTED_TEXT_CLASS = "text-sm font-semibold text-brand-foreground-muted";
const SEARCH_DEBOUNCE_MS = 300;
const MAX_CARD_SKILLS = 4;

/*
 * useDebouncedValue
 * Debounces fast-changing input before it drives a server query.
 * @param value - The value to debounce
 * @param delay - Debounce delay in ms
 * @returns Debounced value
 */
function useDebouncedValue(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

/*
 * formatCardExperience
 * Formats years of experience for compact card display.
 * @param yearsExperience - Number of years or null
 * @returns Human-readable experience string
 */
function formatCardExperience(yearsExperience: number | null): string {
  if (yearsExperience === null) {
    return "Experience unknown";
  }

  if (yearsExperience === 0) {
    return "< 1 year";
  }

  return `${yearsExperience} ${yearsExperience === 1 ? "year" : "years"}`;
}

/*
 * computeDemoSlices
 * Returns the subset of DEMO_ENGINEERS to show alongside real blurred cards.
 * D-05: realCount >= DEMO_THRESHOLD → no demos; 0 < realCount < DEMO_THRESHOLD → fill to 6; 0 → all 6.
 * @param realCount - Number of real blurred cards returned by the API
 * @returns Slice of DEMO_ENGINEERS to pad the grid
 */
function computeDemoSlices(realCount: number): DemoEngineerProfile[] {
  if (realCount >= DEMO_THRESHOLD) return [];
  const needed = Math.max(DEMO_THRESHOLD - realCount, 0);
  return DEMO_ENGINEERS.slice(0, needed);
}

/*
 * TalentCard
 * Renders one candidate preview in the Talent Pool grid.
 * Accepts optional onUnlock for FREE plan blurred cards — shows "Unlock Profile" instead of "View Profile".
 * When onUnlock is not provided (paid plan), shows "View Profile" + optional email button.
 * @param talent - TalentListItem data from API
 * @param onView - Callback to open TalentProfileDialog (paid plan)
 * @param onUnlock - Optional callback for FREE plan blurred card unlock → opens TalentUpgradeModal
 */
function TalentCard({
  talent,
  onView,
  onUnlock,
}: {
  talent: TalentListItem;
  onView: (id: string) => void;
  onUnlock?: () => void;
}): ReactElement {
  const visibleSkills = talent.skills.slice(0, MAX_CARD_SKILLS);
  const hiddenSkillCount = Math.max(talent.skills.length - MAX_CARD_SKILLS, 0);

  return (
    <article className={`${TALENT_CARD_CLASS} flex h-full min-h-64 flex-col`}>
      <div className="mb-4 flex min-h-14 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <InitialsAvatar name={talent.name} image={talent.image} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold capitalize leading-tight tracking-tight text-brand-foreground">
              {talent.name ?? "Unnamed talent"}
            </h2>
            <p className={MUTED_TEXT_CLASS}>
              {talent.headline ?? talent.primaryRole ?? "Candidate profile"}
            </p>
          </div>
        </div>
      </div>

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

      <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-semibold text-brand-foreground-muted">
        <span>{talent.location ?? "Remote"}</span>
        <span>{talent.availability ? formatProfileLabel(talent.availability) : "Availability unknown"}</span>
        <span>{formatCardExperience(talent.yearsExperience)}</span>
        <span>{talent.resumeKey ? "Resume available" : "No resume"}</span>
      </div>

      <div className="mt-auto flex gap-2">
        {onUnlock ? (
          <Button
            type="button"
            onClick={onUnlock}
            variant="secondary"
            className="flex-1"
          >
            Unlock Profile
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => onView(talent.id)}
              variant="default"
              className="flex-1"
            >
              View Profile
            </Button>
            {talent.email && (
              <Button asChild variant="primary" size="icon">
                <a
                  href={`mailto:${talent.email}`}
                  aria-label={`Email ${talent.name ?? "talent"}`}
                >
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}
          </>
        )}
      </div>
    </article>
  );
}

/*
 * TalentCardSkeleton
 * Loading skeleton for Talent Pool candidate cards.
 */
function TalentCardSkeleton(): ReactElement {
  return (
    <article className={`${TALENT_CARD_CLASS} flex h-full min-h-64 flex-col`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-44" />
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-6 w-16 rounded-full"
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-5 w-24" aria-hidden="true" />
        ))}
      </div>

      <div className="mt-auto flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </article>
  );
}

/*
 * TalentPoolClient
 * Talent Pool search and profile discovery experience for recruiters.
 *
 * FREE plan behavior:
 *   - Search bar is disabled (readOnly, opacity-50, cursor-not-allowed) with tooltip.
 *   - Engineer count banner shown above card grid.
 *   - Real blurred cards (API isFreePlan=true) show "Unlock Profile" → TalentUpgradeModal.
 *   - Demo cards pad the grid when realCount < DEMO_THRESHOLD (mix-mode, D-05).
 *
 * Paid plan behavior (unchanged):
 *   - Search bar fully functional.
 *   - Real full cards show "View Profile" → TalentProfileDialog + email button if email present.
 *   - No demo cards, no banner.
 */
export function TalentPoolClient(): ReactElement {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTeaser, setUpgradeTeaser] = useState<string | undefined>(undefined);

  const talentQuery = useFetchTalent({ q: debouncedSearch });
  const isFreePlan = talentQuery.data?.isFreePlan ?? false;
  const demoCount = talentQuery.data?.demoCount ?? 0;
  const talentItems = talentQuery.data?.items ?? [];
  const showTalentSkeleton = talentQuery.isLoading || talentQuery.isFetching;

  /*
   * openUpgrade
   * Opens TalentUpgradeModal with an optional engineer teaser string.
   * Called from: disabled search bar click, Unlock Profile on real blurred card, Unlock Now on demo card.
   * @param teaser - Optional string, e.g. "Priya S. • 88/100 • React, Node.js"
   */
  function openUpgrade(teaser?: string) {
    setUpgradeTeaser(teaser);
    setUpgradeModalOpen(true);
  }

  // Compute demo cards for mix-mode — only for FREE plan (D-05)
  const demoSlices = isFreePlan ? computeDemoSlices(talentItems.length) : [];

  return (
    <section className="space-y-6">
      {/* Search bar — disabled with tooltip for FREE plan (D-04) */}
      <div className="rounded-xl border border-brand-border bg-white p-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-foreground-secondary" />
                <Input
                  value={searchInput}
                  onChange={(event) => {
                    if (!isFreePlan) setSearchInput(event.target.value);
                  }}
                  onClick={() => {
                    if (isFreePlan) openUpgrade();
                  }}
                  placeholder="Search candidates by name, role, skill, location, availability, company, or education"
                  className={`pr-10 pl-10 ${isFreePlan ? "cursor-not-allowed opacity-50" : ""}`}
                  readOnly={isFreePlan}
                />
                {searchInput && !isFreePlan && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Clear talent search"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setSearchInput("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TooltipTrigger>
            {isFreePlan && (
              <TooltipContent>
                <p>Upgrade to search 47+ verified engineers</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Engineer count banner — FREE plan only, above card grid (D-06) */}
      {isFreePlan && (
        <div className="rounded-xl border border-brand-border bg-brand-surface px-5 py-4 text-sm font-semibold text-brand-foreground-muted">
          {demoCount > 0
            ? `${demoCount} verified engineer${demoCount === 1 ? "" : "s"} in the pool — upgrade to see them all`
            : "India's top verified engineers — be first to discover them"}
        </div>
      )}

      {/* Card grid — loading skeleton | error | empty (paid only) | real + demo cards */}
      {showTalentSkeleton ? (
        <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <TalentCardSkeleton key={index} />
          ))}
        </div>
      ) : talentQuery.isError ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center text-sm font-semibold text-brand-danger">
          Talent pool could not be loaded.
        </div>
      ) : talentItems.length === 0 && !isFreePlan ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center text-sm font-semibold text-brand-foreground-muted">
          No matching talent found.
        </div>
      ) : (
        <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Real cards — blurred for FREE plan ("Unlock Profile"), full for paid ("View Profile") */}
          {talentItems.map((talent) => (
            <TalentCard
              key={talent.id}
              talent={talent}
              onView={setSelectedTalentId}
              onUnlock={
                isFreePlan
                  ? () =>
                      openUpgrade(
                        `${talent.name} • ${talent.skills.slice(0, 3).join(", ")}`
                      )
                  : undefined
              }
            />
          ))}
          {/* Demo cards — padded after real cards for FREE plan mix-mode (D-05) */}
          {demoSlices.map((profile) => (
            <DemoEngineerCard
              key={profile.id}
              profile={profile}
              onUpgrade={() =>
                openUpgrade(
                  `${profile.name} • ${profile.hiretivoScore}/100 • ${profile.skills.slice(0, 3).join(", ")}`
                )
              }
            />
          ))}
        </div>
      )}

      {/* TalentProfileDialog — paid plan profile view (unchanged) */}
      <TalentProfileDialog
        seekerId={selectedTalentId}
        open={Boolean(selectedTalentId)}
        onOpenChange={(open) => {
          if (!open) setSelectedTalentId(null);
        }}
      />

      {/* TalentUpgradeModal — FREE plan upgrade gate, triggered by demo cards + real blurred cards + search */}
      <TalentUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        engineerTeaser={upgradeTeaser}
      />
    </section>
  );
}
