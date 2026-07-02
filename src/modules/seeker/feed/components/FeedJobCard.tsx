'use client';

import { differenceInDays, parseISO } from 'date-fns';
import { JobCard } from '@/components/shared/JobCard';
import { MatchRing } from '@/components/shared/MatchRing';
import { Badge } from '@/components/ui/badge';
import { CreditWarning } from '@/modules/seeker/feed/components/CreditWarning';
import { STALE_JOB_DAYS } from '@/modules/seeker/feed/constants/feed-thresholds';
import type { FeedJobItem } from '@/modules/seeker/feed/types/feed.types';

interface FeedJobCardProps {
  job: FeedJobItem;
  isSaved: boolean;
  onApply: () => void;
  onPass: () => void;
  onOpen: () => void;
  isSaving?: boolean;
  isDismissing?: boolean;
  applyLockedLabel?: string;
  onToggleSave: () => void;
}

/* FeedJobCard
 * Wraps the shared JobCard with a match ring, credit warning (low-match nudge), and a
 * "may be closed" stale flag. Clicking anywhere on the card except a link/button opens
 * the detail drawer (onOpen); links/buttons keep their own behavior.
 * @param job - feed job item (match score, publishedAtIso, etc.) */
export function FeedJobCard({
  job,
  isSaved,
  onApply,
  onPass,
  onOpen,
  isSaving,
  isDismissing,
  applyLockedLabel,
  onToggleSave,
}: FeedJobCardProps) {
  const isStale = job.publishedAtIso
    ? differenceInDays(new Date(), parseISO(job.publishedAtIso)) > STALE_JOB_DAYS
    : false;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a,button')) return;
    onOpen();
  };

  return (
    <div className="relative cursor-pointer" onClick={handleCardClick}>
      <div className="pointer-events-none absolute left-5 top-5 z-10">
        <MatchRing score={job.matchScore ?? 0} size="sm" />
      </div>
      {isStale && (
        <div className="absolute right-5 top-5 z-10">
          <Badge variant="secondary">May be closed</Badge>
        </div>
      )}
      <div className="pl-12">
        <JobCard
          job={job}
          isSaved={isSaved}
          onApply={onApply}
          onNotInterested={onPass}
          onToggleSave={onToggleSave}
          isSaving={isSaving}
          isDismissing={isDismissing}
          applyLockedLabel={applyLockedLabel}
        />
      </div>
      <div className="mt-3">
        <CreditWarning score={job.matchScore ?? 0} />
      </div>
    </div>
  );
}
