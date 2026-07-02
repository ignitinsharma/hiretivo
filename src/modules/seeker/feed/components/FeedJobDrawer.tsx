'use client';

import { ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MatchRing } from '@/components/shared/MatchRing';
import { JobDetailSidebar } from '@/modules/jobs/components/JobDetailSidebar';
import { useJobDetail } from '@/modules/seeker/feed/queries/use-job-detail';
import { UserRole } from '@/constants/enums';

interface FeedJobDrawerProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* FeedJobDrawer
 * Full job detail drawer opened from a feed card. Reuses JobDetailSidebar (apply/save/match
 * breakdown) inside a shadcn Sheet — full-width on mobile, side-panel on desktop.
 * @param jobId - job to show, null renders nothing
 * @param open / onOpenChange - Sheet open state */
export function FeedJobDrawer({ jobId, open, onOpenChange }: FeedJobDrawerProps) {
  const { data, isLoading, isError, refetch } = useJobDetail(jobId);

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
              <JobDetailSidebar
                job={{
                  id: data.job.id,
                  title: data.job.title,
                  companyName: data.job.companyName,
                  publishedAt: data.job.publishedAt,
                  applyType: data.job.applyType,
                  externalApplyUrl: data.job.externalApplyUrl,
                }}
                matchScore={data.matchScore}
                matchBreakdown={data.matchBreakdown}
                isAuth
                userRole={UserRole.SEEKER}
                recommendedJobs={[]}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
