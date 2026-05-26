"use client";

import { Lock, Mail, Search, X } from "lucide-react";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/store/use-ui-store";
import {
  TalentForbiddenError,
  useFetchTalent,
} from "@/modules/recruiter/talent/queries/use-fetch-talent";
import { formatProfileLabel } from "@/modules/recruiter/talent/utils/format-profile-label";
import type { TalentListItem } from "@/modules/recruiter/talent/types/talent.types";

import { TalentProfileDialog } from "./TalentProfileDialog";

const TALENT_CARD_CLASS = "rounded-xl border border-brand-border bg-white p-5";
const MUTED_TEXT_CLASS = "text-sm font-semibold text-brand-foreground-muted";
const SEARCH_DEBOUNCE_MS = 300;
const MAX_CARD_SKILLS = 4;

/**
 * Debounces fast-changing input before it drives a server query.
 */
function useDebouncedValue(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

/**
 * Formats years of experience for compact card display.
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

/**
 * Renders one candidate preview in the Talent Pool grid.
 */
function TalentCard({
  talent,
  onView,
}: {
  talent: TalentListItem;
  onView: (id: string) => void;
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
      </div>
    </article>
  );
}

/**
 * Skeleton for Talent Pool candidate cards.
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

/**
 * Talent Pool search and profile discovery experience for recruiters.
 */
export function TalentPoolClient(): ReactElement {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const { openPaidFeatureModal } = useUIStore();
  const talentQuery = useFetchTalent({ q: debouncedSearch });
  const isLocked = talentQuery.error instanceof TalentForbiddenError;
  const talentItems = talentQuery.data?.items ?? [];
  const showTalentSkeleton = talentQuery.isLoading || talentQuery.isFetching;

  if (isLocked) {
    return (
      <section className="rounded-xl border border-brand-border bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface text-brand-foreground">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
          Unlock Talent Pool
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-brand-foreground-muted md:text-lg">
          Search and contact candidates directly with Pro or Enterprise.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={() =>
            openPaidFeatureModal({
              feature: "talent_pool",
              title: "Unlock Talent Pool",
              description: "Search and contact candidates directly with Pro.",
            })
          }
          className="mt-6"
        >
          Upgrade to Pro
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-brand-border bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-foreground-secondary" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search candidates by name, role, skill, location, availability, company, or education"
            className="pr-10 pl-10"
          />
          {searchInput && (
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
      </div>

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
      ) : talentItems.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center text-sm font-semibold text-brand-foreground-muted">
          No matching talent found.
        </div>
      ) : (
        <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {talentItems.map((talent) => (
            <TalentCard
              key={talent.id}
              talent={talent}
              onView={setSelectedTalentId}
            />
          ))}
        </div>
      )}

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
