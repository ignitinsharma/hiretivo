"use client";

import { Briefcase, Clock, Copy, FileText, Loader2, Mail, MapPin, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { HiretivoVerifiedBadge } from "@/components/shared/HiretivoVerifiedBadge";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { VerificationStatus } from "@/constants/enums";
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
import { cn } from "@/lib/utils";
import type { DemoEngineerProfile } from "@/constants/demo-engineers";
import { useFetchTalent } from "@/modules/recruiter/talent/queries/use-fetch-talent";
import { useAiSearchTalent } from "@/modules/recruiter/talent/queries/use-ai-search-talent";
import { formatProfileLabel } from "@/modules/recruiter/talent/utils/format-profile-label";
import type { TalentListItem, AiSearchResponseData } from "@/modules/recruiter/talent/types/talent.types";
import type { ParsedFilters } from "@/lib/validations/ai-search.schema";

import { DemoEngineerCard } from "./DemoEngineerCard";
import { TalentProfileDialog } from "./TalentProfileDialog";

const TALENT_CARD_CLASS = "rounded-xl border border-brand-border bg-white p-5";
const MUTED_TEXT_CLASS = "text-sm font-semibold text-brand-foreground-muted";
const SEARCH_DEBOUNCE_MS = 300;
const MAX_CARD_SKILLS = 4;
const TALENT_PRICING_URL = `/pricing?returnTo=${encodeURIComponent("/recruiter/talent")}`;

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
 * removeFilterChip
 * Returns a new ParsedFilters object with the specified chip value removed.
 * @param filters - Current parsed filters
 * @param type - The filter field to modify
 * @param value - The value to remove from that field
 */
function removeFilterChip(filters: ParsedFilters, type: keyof ParsedFilters, value: string): ParsedFilters {
  switch (type) {
    case "skills":
      return { ...filters, skills: filters.skills?.filter((s) => s !== value) };
    case "keywords":
      return { ...filters, keywords: filters.keywords?.filter((k) => k !== value) };
    case "role":
      return { ...filters, role: undefined };
    case "location":
      return { ...filters, location: undefined };
    case "availability":
      return { ...filters, availability: undefined };
    case "workPreference":
      return { ...filters, workPreference: undefined };
    case "minYears":
      return { ...filters, minYears: undefined };
    case "maxYears":
      return { ...filters, maxYears: undefined };
    default:
      return filters;
  }
}

/*
 * FilterChip
 * Removable chip representing a parsed AI search filter.
 */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }): ReactElement {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/*
 * TalentCard
 * Renders one candidate preview in the Talent Pool grid.
 * Accepts optional onUnlock for FREE plan blurred cards — shows "Unlock Profile" instead of "View Profile".
 * When onUnlock is not provided (paid plan), shows "View Profile" + optional email button.
 * Renders matchReason (when present from AI search) above the action buttons.
 * @param talent - TalentListItem data from API
 * @param onView - Callback to open TalentProfileDialog (paid plan)
 * @param onUnlock - Optional callback for FREE plan blurred card unlock → opens TalentUpgradeModal
 * @param isUnlocking - Whether this card's unlock is in progress
 */
function TalentCard({
  talent,
  onView,
  onUnlock,
  isUnlocking,
}: {
  talent: TalentListItem;
  onView: (id: string) => void;
  onUnlock?: () => void;
  isUnlocking?: boolean;
}): ReactElement {
  const visibleSkills = talent.skills.slice(0, MAX_CARD_SKILLS);
  const hiddenSkillCount = Math.max(talent.skills.length - MAX_CARD_SKILLS, 0);
  const copyEmail = async () => {
    if (!talent.email) return;
    try {
      await navigator.clipboard.writeText(talent.email);
      toast.success("Email copied.");
    } catch {
      toast.error("Could not copy email.");
    }
  };

  return (
    <article className={cn(TALENT_CARD_CLASS, "flex h-full min-h-64 flex-col")}>
      <div className="mb-4 flex min-h-14 items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3">
          <InitialsAvatar
            name={talent.name}
            email={talent.email}
            userId={talent.id}
            image={talent.image}
            size="lg"
            verified={talent.verificationStatus === VerificationStatus.VERIFIED}
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <h2
                className={cn(
                  "truncate text-lg font-bold capitalize leading-tight tracking-tight text-brand-foreground",
                  !talent.isUnlocked && "select-none blur-[2px]", // Frosted blur is cosmetic — the name is already masked server-side when locked.
                )}
              >
                {!talent.isUnlocked && (
                  <span className="sr-only">Locked candidate. </span>
                )}
                {talent.name ?? "Unnamed talent"}
              </h2>
              <HiretivoVerifiedBadge variant="inline" size="sm" />
            </div>
            <p className={cn(MUTED_TEXT_CLASS, "truncate")}>
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
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {talent.location ?? "Location not provided"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {talent.availability
            ? formatProfileLabel(talent.availability)
            : "Availability unknown"}
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          {formatCardExperience(talent.yearsExperience)}
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          {talent.resumeKey ? "Resume available" : "No resume"}
        </span>
      </div>

      {talent.matchReason && (
        <p className="mb-3 text-xs leading-relaxed text-brand-foreground-muted italic">
          {talent.matchReason}
        </p>
      )}

      <div className="mt-auto flex gap-2">
        {onUnlock ? (
          <Button
            type="button"
            onClick={onUnlock}
            variant="secondary"
            className="flex-1"
            disabled={isUnlocking}
          >
            {isUnlocking ? "Unlocking…" : "Unlock Profile"}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => onView(talent.id)}
              variant="secondary"
              className="flex-1"
            >
              View Profile
            </Button>
            {talent.email && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={copyEmail}
                      aria-label={`Copy email for ${talent.name ?? "talent"}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy email</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="primary" size="icon">
                      <a
                        href={`mailto:${talent.email}`}
                        aria-label={`Email ${talent.name ?? "talent"}`}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Email candidate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
    <article className={cn(TALENT_CARD_CLASS, "flex h-full min-h-64 flex-col")}>
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
 *   - Real blurred cards (API isFreePlan=true) show "Unlock Profile" → Pricing.
 *   - Demo cards pad the grid when realCount < DEMO_THRESHOLD (mix-mode, D-05).
 *   - No Load More button (blurred grid is fixed size).
 *
 * Paid plan behavior:
 *   - Search bar fully functional; submit on Enter or Search button.
 *   - AI search: natural-language query triggers AI-ranked results with parsed filter chips.
 *   - Chip removal triggers re-search with updated filters (skips parse step).
 *   - Clearing search box reverts to full keyword browse with Load More.
 *   - 12 candidates per page; Load More appends next page (keyword browse only).
 *   - "Showing N of M verified candidates" / "N of M match 'query'" count.
 *   - Stale results shown with opacity fade during search transitions.
 *   - Load More error shows retry button without clearing existing results.
 *   - AI HTTP error → toast + fall back to keyword browse results.
 */
export function TalentPoolClient(): ReactElement {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeParsedFilters, setActiveParsedFilters] = useState<ParsedFilters | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const isAiMode = submittedQuery.trim().length > 0;

  // Always fetch keyword browse; AI search enabled only when submittedQuery is set.
  const talentQuery = useFetchTalent({ q: "" });
  const aiSearchQuery = useAiSearchTalent(submittedQuery, activeParsedFilters);

  // Derive flat item list from all loaded pages.
  const allPages = talentQuery.data?.pages ?? [];
  const firstPage = allPages[0];
  const isFreePlan = firstPage?.isFreePlan ?? false;
  const demoCount = firstPage?.demoCount ?? 0;
  const total = firstPage?.total ?? 0;

  // AI response data
  const aiData: AiSearchResponseData | undefined = aiSearchQuery.data;
  const displayedParsedFilters = aiData?.parsedFilters;

  // In AI mode (and no HTTP error): use AI results. Otherwise: use keyword browse pages.
  const talentItems = isAiMode && !aiSearchQuery.isError
    ? (aiData?.items ?? [])
    : allPages.flatMap((page) => page.items);

  // Loading states: separate AI mode vs keyword browse skeletons.
  const showAiSkeleton = isAiMode && aiSearchQuery.isLoading;
  const showTalentSkeleton = !isAiMode && talentQuery.isLoading;
  const showAnySkeleton = showAiSkeleton || showTalentSkeleton;

  // Search transition: new query firing but stale data exists (keepPreviousData).
  // Show grid with reduced opacity so the user knows results are refreshing.
  const isSearchRefreshing =
    talentQuery.isFetching &&
    !talentQuery.isFetchingNextPage &&
    !talentQuery.isLoading &&
    unlockingId === null;

  // Error on initial load (no data) vs error after partial load (keep existing cards).
  const hasLoadedSome = allPages.length > 0;
  const isInitialError = talentQuery.isError && !hasLoadedSome;
  const isLoadMoreError = talentQuery.isError && hasLoadedSome;

  // Toast on AI HTTP error — fall back to keyword browse display.
  useEffect(() => {
    if (aiSearchQuery.isError && isAiMode) {
      toast.error("AI search unavailable — showing keyword results.");
    }
  }, [aiSearchQuery.isError, isAiMode]);

  // Toast when AI soft-failed (aiRanked: false in response).
  useEffect(() => {
    if (aiData && !aiData.aiRanked && isAiMode) {
      toast("AI ranking unavailable — showing keyword matches.", { icon: "ℹ️" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiData?.aiRanked]);

  /*
   * goToPricing
   * Sends free-plan upgrade intent through the canonical pricing page.
   * Called from: disabled search bar click, Unlock Profile on real blurred card, Unlock Profile on demo card.
   */
  function goToPricing() {
    router.push(TALENT_PRICING_URL);
  }

  /*
   * handleAiSearch
   * Submits the current input as an AI query.
   * Resets parsed filters so the full parse+rerank pipeline runs.
   */
  function handleAiSearch() {
    const query = searchInput.trim();
    if (!query) return;
    setSubmittedQuery(query);
    setActiveParsedFilters(undefined);
  }

  /*
   * handleSearchKeyDown
   * Submits AI search on Enter key press (paid plan only).
   */
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !isFreePlan) {
      handleAiSearch();
    }
  }

  /*
   * handleClearSearch
   * Clears the search box and exits AI mode, reverting to full keyword browse.
   */
  function handleClearSearch() {
    setSearchInput("");
    setSubmittedQuery("");
    setActiveParsedFilters(undefined);
  }

  /*
   * handleChipRemove
   * Removes one parsed filter chip and triggers a re-search skipping the parse step.
   * @param chipType - The ParsedFilters field to remove from
   * @param chipValue - The specific value to remove (or empty string for scalar fields)
   */
  function handleChipRemove(chipType: keyof ParsedFilters, chipValue: string) {
    if (!displayedParsedFilters) return;
    const newFilters = removeFilterChip(displayedParsedFilters, chipType, chipValue);
    setActiveParsedFilters(newFilters);
  }

  /*
   * handleUnlock
   * Calls POST /api/recruiter/talent/[id]/unlock and refetches the talent list.
   * Invalidating an infinite query refetches all loaded pages — intentional,
   * keeps unlock state consistent across all visible cards.
   * Idempotent — re-unlocking returns 200 without consuming quota.
   */
  async function handleUnlock(engineerId: string) {
    setUnlockingId(engineerId);
    try {
      const res = await fetch(`/api/recruiter/talent/${engineerId}/unlock`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to unlock profile. Try again.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["recruiter-talent"] });
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setUnlockingId(null);
    }
  }

  /*
   * buildCountLabel
   * Returns the "Showing N of M …" line for paid plan.
   * Uses total from page 1 (stable for the current search session).
   */
  function buildCountLabel(): string {
    const loaded = talentItems.length;
    if (debouncedSearch.trim()) {
      return `${loaded} of ${total} candidates match "${debouncedSearch.trim()}"`;
    }
    return `Showing ${loaded} of ${total} verified candidates`;
  }

  // Compute demo cards for mix-mode — only for FREE plan (D-05)
  const demoSlices = isFreePlan ? computeDemoSlices(talentItems.length) : [];

  return (
    <section className="space-y-6">
      {/* Search bar — disabled with tooltip for FREE plan (D-04); AI search for paid */}
      <div className="rounded-xl border border-brand-border bg-white p-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Outer wrapper: flex row with Search button for paid plan */}
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-foreground-secondary" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onClick={() => {
                      if (isFreePlan) goToPricing();
                    }}
                    placeholder={
                      isFreePlan
                        ? "Search candidates by name, role, skill, location…"
                        : "Describe who you're looking for… (press Enter to search)"
                    }
                    className={cn(
                      "pr-10 pl-10",
                      isFreePlan && "cursor-not-allowed opacity-50",
                    )}
                    readOnly={isFreePlan}
                  />
                  {searchInput && !isFreePlan && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Clear search"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={handleClearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!isFreePlan && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAiSearch}
                    disabled={!searchInput.trim() || aiSearchQuery.isFetching}
                    aria-label="Search with AI"
                  >
                    {aiSearchQuery.isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </TooltipTrigger>
            {isFreePlan && (
              <TooltipContent>
                <p>Upgrade to search {demoCount}+ verified engineers</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Parsed filter chips — shown after AI search returns results */}
        {isAiMode && displayedParsedFilters && (
          <div className="flex flex-wrap gap-2 pt-3">
            {displayedParsedFilters.skills?.map((skill) => (
              <FilterChip
                key={`skill-${skill}`}
                label={skill}
                onRemove={() => handleChipRemove("skills", skill)}
              />
            ))}
            {displayedParsedFilters.keywords?.map((kw) => (
              <FilterChip
                key={`kw-${kw}`}
                label={kw}
                onRemove={() => handleChipRemove("keywords", kw)}
              />
            ))}
            {displayedParsedFilters.role && (
              <FilterChip
                label={`Role: ${displayedParsedFilters.role}`}
                onRemove={() => handleChipRemove("role", displayedParsedFilters.role!)}
              />
            )}
            {displayedParsedFilters.location && (
              <FilterChip
                label={`📍 ${displayedParsedFilters.location}`}
                onRemove={() => handleChipRemove("location", displayedParsedFilters.location!)}
              />
            )}
            {displayedParsedFilters.workPreference && (
              <FilterChip
                label={displayedParsedFilters.workPreference}
                onRemove={() => handleChipRemove("workPreference", displayedParsedFilters.workPreference!)}
              />
            )}
            {displayedParsedFilters.minYears != null && (
              <FilterChip
                label={`${displayedParsedFilters.minYears}+ yrs`}
                onRemove={() => handleChipRemove("minYears", "")}
              />
            )}
            {displayedParsedFilters.availability && (
              <FilterChip
                label={`Available: ${displayedParsedFilters.availability}`}
                onRemove={() => handleChipRemove("availability", displayedParsedFilters.availability!)}
              />
            )}
          </div>
        )}
      </div>

      {/* Count label — paid plan only, shown once data arrives */}
      {/* {!isFreePlan && !showAnySkeleton && total > 0 && (
        <p className="text-sm font-semibold text-brand-foreground-muted">
          {buildCountLabel()}
        </p>
      )} */}

      {/* Card grid — loading skeleton | initial error | empty | real + demo cards */}
      {showAnySkeleton ? (
        <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <TalentCardSkeleton key={index} />
          ))}
        </div>
      ) : isInitialError ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center text-sm font-semibold text-brand-danger">
          Talent pool could not be loaded.
        </div>
      ) : isAiMode && !aiSearchQuery.isLoading && talentItems.length === 0 ? (
        /* AI mode empty state */
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center">
          <p className="text-sm font-semibold text-brand-foreground-muted">
            No engineers matched your search.
          </p>
          <p className="mt-1 text-xs text-brand-foreground-secondary">
            Try removing location or availability from your query.
          </p>
        </div>
      ) : talentItems.length === 0 && !isFreePlan ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center text-sm font-semibold text-brand-foreground-muted">
          No matching talent found.
        </div>
      ) : (
        <div
          className={cn(
            "grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3",
            isSearchRefreshing && "opacity-60 transition-opacity duration-200",
          )}
        >
          {/* Real cards — blurred for FREE plan ("Unlock Profile"), full for paid ("View Profile") */}
          {talentItems.map((talent) => (
            <TalentCard
              key={talent.id}
              talent={talent}
              onView={setSelectedTalentId}
              isUnlocking={unlockingId === talent.id}
              onUnlock={
                isFreePlan
                  ? goToPricing
                  : !talent.isUnlocked
                    ? () => handleUnlock(talent.id)
                    : undefined
              }
            />
          ))}
          {/* Demo cards — padded after real cards for FREE plan mix-mode (D-05) */}
          {demoSlices.map((profile) => (
            <DemoEngineerCard
              key={profile.id}
              profile={profile}
              onUpgrade={goToPricing}
            />
          ))}
        </div>
      )}

      {/* Load More — paid plan only; hidden in AI mode (single-page response) */}
      {!isFreePlan && !showAnySkeleton && !isAiMode && (
        <div className="flex flex-col items-center gap-3 pt-2">
          {/* Load-more error: keep existing cards, show retry */}
          {isLoadMoreError && (
            <p className="text-sm font-semibold text-brand-danger">
              Failed to load more candidates.
            </p>
          )}
          {/* Show Load More when more pages exist OR when previous load failed (retry) */}
          {(talentQuery.hasNextPage || isLoadMoreError) && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => talentQuery.fetchNextPage()}
              disabled={talentQuery.isFetchingNextPage}
              className="min-w-36"
            >
              {talentQuery.isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : isLoadMoreError ? (
                "Retry"
              ) : (
                "Load more"
              )}
            </Button>
          )}
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
    </section>
  );
}
