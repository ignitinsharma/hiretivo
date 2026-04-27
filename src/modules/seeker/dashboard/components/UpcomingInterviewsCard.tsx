'use client';

import { format } from 'date-fns';
import { Calendar, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFetchSeekerInterviews } from '../queries/use-fetch-seeker-interviews';
import type { SeekerInterview } from '../types/dashboard.types';

const CARD_CLASSES = 'bg-white rounded-2xl border border-[rgba(14,15,12,0.12)] p-6';

const SECTION_TITLE_CLASSES =
  "text-xl font-semibold text-brand-heading [font-feature-settings:'calt']";

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return format(new Date(dateStr), 'MMM d, yyyy · h:mm a');
}

function InterviewRow({ interview }: { interview: SeekerInterview }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[rgba(14,15,12,0.08)] last:border-b-0 last:pb-0 first:pt-0">
      <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center shrink-0">
        <Calendar className="w-5 h-5 text-brand-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-brand-heading [font-feature-settings:'calt']">
          {interview.companyName}
        </p>
        <p className="text-sm text-brand-muted-secondary [font-feature-settings:'calt'] mt-0.5">
          {interview.jobTitle}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-brand-body [font-feature-settings:'calt']">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-brand-muted" />
            {formatDateTime(interview.startsAt)}
          </span>
          {interview.meetLink && (
            <a
              href={interview.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-brand-primary hover:underline transition-colors"
            >
              <Video className="w-4 h-4" />
              Join Meet
            </a>
          )}
        </div>
        {interview.notes && (
          <p className="mt-2 text-sm text-brand-muted [font-feature-settings:'calt'] line-clamp-2">
            {interview.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className={CARD_CLASSES}>
      <Skeleton className="h-6 w-48 mb-6" />
      {[0, 1].map((i) => (
        <div key={i} className="flex items-start gap-4 py-4 border-b border-[rgba(14,15,12,0.08)] last:border-b-0 last:pb-0 first:pt-0">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={cn(CARD_CLASSES, 'text-center')}>
      <Calendar className="w-12 h-12 text-brand-muted mx-auto" />
      <h3 className={cn(SECTION_TITLE_CLASSES, 'mt-4')}>No upcoming interviews</h3>
      <p className="mt-2 text-brand-muted [font-feature-settings:'calt']">
        When a recruiter schedules an interview, it will appear here.
      </p>
    </div>
  );
}

export function UpcomingInterviewsCard() {
  const { data: interviews, isLoading, isError } = useFetchSeekerInterviews();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className={cn(CARD_CLASSES, 'text-center')}>
        <p className="text-brand-muted [font-feature-settings:'calt']">
          Could not load interviews.
        </p>
      </div>
    );
  }

  if (!interviews || interviews.length === 0) return <EmptyState />;

  return (
    <div className={CARD_CLASSES}>
      <h2 className={SECTION_TITLE_CLASSES}>Upcoming Interviews</h2>
      <div className="mt-4">
        {interviews.map((interview) => (
          <InterviewRow key={interview.id} interview={interview} />
        ))}
      </div>
    </div>
  );
}
