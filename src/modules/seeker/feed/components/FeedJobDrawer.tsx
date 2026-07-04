'use client';

import type { ReactNode } from 'react';
import { Ban, Bookmark, BriefcaseBusiness, Clock, ExternalLink, MapPin, Tag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatchRing } from '@/components/shared/MatchRing';
import { useJobDetail } from '@/modules/seeker/feed/queries/use-job-detail';
import { formatEnumLabel, formatSalaryRange } from '@/lib/home-page-utils';

interface FeedJobDrawerProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaved: boolean;
  isSaving?: boolean;
  isDismissing?: boolean;
  onToggleSave: () => void;
  onPass: () => void;
  onApply: () => void;
  /** Active feed search term — matches are highlighted inside the job description. */
  searchTerm?: string;
}

/* highlightMatches
 * Wraps case-insensitive occurrences of `term` inside `text` in <mark> for the JD viewer.
 * @param text - source text (job description)
 * @param term - active search query, ignored if shorter than 2 chars
 * @returns text with matches highlighted, or the original text unchanged */
function highlightMatches(text: string, term?: string): ReactNode {
  const query = term?.trim();
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-brand-primary/20 px-0.5 text-brand-foreground">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/* FeedJobDrawer
 * Full job detail drawer opened from a feed card: description, meta facts, save/pass/apply
 * actions (routed through the same wizard mutation as the card), and a link to the original
 * posting. Missing meta fields are hidden rather than rendered blank.
 * @param jobId - job to show, null renders nothing
 * @param open / onOpenChange - Sheet open state
 * @param isSaved/isSaving/isDismissing - save+pass mutation state for this job, from the parent
 * @param onToggleSave/onPass/onApply - mutation triggers, shared with FeedJobCard
 * @param searchTerm - current feed search filter, highlighted inside the JD text */
export function FeedJobDrawer({
  jobId,
  open,
  onOpenChange,
  isSaved,
  isSaving,
  isDismissing,
  onToggleSave,
  onPass,
  onApply,
  searchTerm,
}: FeedJobDrawerProps) {
  const { data, isLoading, isError, refetch } = useJobDetail(jobId);

  const facts = data
    ? [
        { icon: MapPin, label: formatEnumLabel(data.job.workType) ?? data.job.location },
        { icon: BriefcaseBusiness, label: formatEnumLabel(data.job.jobType) },
        { icon: Clock, label: data.job.experienceLevel },
        { icon: Tag, label: data.job.category },
      ].filter((fact): fact is { icon: typeof MapPin; label: string } => Boolean(fact.label))
    : [];

  const salaryLabel = data && (data.job.salaryMin || data.job.salaryMax)
    ? formatSalaryRange(data.job.salaryMin, data.job.salaryMax, data.job.currency)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {!jobId ? null : isLoading ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <p className="text-sm text-brand-foreground-muted">Couldn&apos;t load this job.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <SheetHeader className="flex-row items-center gap-3 space-y-0 text-left">
              <MatchRing score={data.matchScore ?? 0} size="sm" />
              <div className="min-w-0">
                <SheetTitle className="truncate">{data.job.title}</SheetTitle>
                <p className="truncate text-sm text-brand-foreground-muted">{data.job.companyName}</p>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-brand-foreground-muted">
                {facts.map((fact, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <fact.icon className="h-4 w-4" />
                    {fact.label}
                  </span>
                ))}
                {salaryLabel && <Badge variant="secondary">{salaryLabel}</Badge>}
              </div>

              {data.job.externalApplyUrl && (
                <a
                  href={data.job.externalApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
                >
                  View original posting
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">
                  Job description
                </h3>
                <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-brand-border bg-brand-surface p-4 text-sm leading-relaxed text-brand-foreground">
                  {highlightMatches(data.job.description, searchTerm)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-brand-border pt-4">
                <Button
                  type="button"
                  onClick={onToggleSave}
                  variant="secondary"
                  size="sm"
                  loading={isSaving}
                  loadingText={isSaved ? 'Removing' : 'Saving'}
                  aria-pressed={isSaved}
                >
                  <Bookmark className={isSaved ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button type="button" onClick={onPass} variant="secondary" size="sm" loading={isDismissing} loadingText="Removing">
                  <Ban className="h-4 w-4" />
                  Not interested
                </Button>
                <Button type="button" onClick={onApply} variant="primary" size="sm" className="ml-auto">
                  Apply Now
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
