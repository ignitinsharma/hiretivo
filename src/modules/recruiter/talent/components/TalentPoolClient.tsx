'use client';

import { Lock, Mail, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/store/use-ui-store';
import {
  TalentForbiddenError,
  useFetchTalent,
  useToggleTalentShortlist,
} from '@/modules/recruiter/talent/queries/use-fetch-talent';
import type { TalentListItem } from '@/modules/recruiter/talent/types/talent.types';

import { TalentProfileDialog } from './TalentProfileDialog';

function TalentCard({
  talent,
  onView,
}: {
  talent: TalentListItem;
  onView: (id: string) => void;
}) {
  const shortlistMutation = useToggleTalentShortlist();

  return (
    <article className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-5 shadow-[rgba(89,82,229,0.12)_0px_0px_0px_1px]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <InitialsAvatar name={talent.name} image={talent.image} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-[#0e0f0c] [font-feature-settings:'calt']">
              {talent.name ?? 'Unnamed talent'}
            </h2>
            <p className="truncate text-sm font-semibold text-[#454745]">
              {talent.headline ?? talent.primaryRole ?? 'Candidate profile'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={talent.isShortlisted ? 'Remove shortlist' : 'Shortlist talent'}
          onClick={() =>
            shortlistMutation.mutate({
              seekerId: talent.id,
              isShortlisted: talent.isShortlisted,
            })
          }
          className="rounded-full transition-transform hover:scale-105 active:scale-95"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {talent.skills.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[rgba(89,82,229,0.1)] px-3 py-1 text-xs font-semibold text-[#5952e5]"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 text-sm font-semibold text-[#454745]">
        <span>{talent.location ?? 'Remote'}</span>
        <span>{talent.availability ?? 'Availability unknown'}</span>
        <span>{talent.yearsExperience ?? 0} years</span>
        <span>{talent.resumeKey ? 'Resume available' : 'No resume'}</span>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => onView(talent.id)}
          className="flex-1 rounded-full bg-[#5952e5] text-white transition-transform hover:scale-105 active:scale-95"
        >
          View Profile
        </Button>
        {talent.email && (
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full transition-transform hover:scale-105 active:scale-95"
          >
            <a href={`mailto:${talent.email}`} aria-label={`Email ${talent.name ?? 'talent'}`}>
              <Mail className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}

export function TalentPoolClient() {
  const [filters, setFilters] = useState({
    q: '',
    skill: '',
    location: '',
    availability: '',
  });
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const { openPaidFeatureModal } = useUIStore();
  const talentQuery = useFetchTalent(filters);
  const isLocked = talentQuery.error instanceof TalentForbiddenError;
  const talentItems = talentQuery.data?.items ?? [];

  if (isLocked) {
    return (
      <section className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(89,82,229,0.1)] text-[#5952e5]">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-[40px] font-black leading-[0.85] text-[#0e0f0c] [font-feature-settings:'calt']">
          Unlock Talent Pool
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[18px] font-semibold leading-[1.44] tracking-[-0.108px] text-[#454745] [font-feature-settings:'calt']">
          Search and contact candidates directly with Pro or Enterprise.
        </p>
        <Button
          type="button"
          onClick={() =>
            openPaidFeatureModal({
              feature: 'talent_pool',
              title: 'Unlock Talent Pool',
              description: 'Search and contact candidates directly with Pro.',
            })
          }
          className="mt-6 rounded-full bg-[#5952e5] text-white transition-transform hover:scale-105 active:scale-95"
        >
          Upgrade to Pro
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#868685]" />
            <Input
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Search by name, role, email, or skill"
              className="rounded-2xl pl-10 focus-visible:border-[#5952e5] focus-visible:ring-2 focus-visible:ring-[#5952e5]/30"
            />
          </div>
          <Input
            value={filters.skill}
            onChange={(event) => setFilters((prev) => ({ ...prev, skill: event.target.value }))}
            placeholder="Skill"
            className="rounded-2xl focus-visible:border-[#5952e5] focus-visible:ring-2 focus-visible:ring-[#5952e5]/30"
          />
          <Input
            value={filters.location}
            onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Location"
            className="rounded-2xl focus-visible:border-[#5952e5] focus-visible:ring-2 focus-visible:ring-[#5952e5]/30"
          />
          <Input
            value={filters.availability}
            onChange={(event) => setFilters((prev) => ({ ...prev, availability: event.target.value }))}
            placeholder="Availability"
            className="rounded-2xl focus-visible:border-[#5952e5] focus-visible:ring-2 focus-visible:ring-[#5952e5]/30"
          />
        </div>
      </div>

      {talentQuery.isLoading ? (
        <div className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-8 text-center text-sm font-semibold text-[#454745]">
          Loading talent...
        </div>
      ) : talentQuery.isError ? (
        <div className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-8 text-center text-sm font-semibold text-[#d03238]">
          Talent pool could not be loaded.
        </div>
      ) : talentItems.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-8 text-center text-sm font-semibold text-[#454745]">
          No matching talent found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
