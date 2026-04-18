'use client';

import { Calendar, Clock, Video } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface UpcomingInterviewItem {
  id: string;
  startsAt: string;
  meetLink: string | null;
  application: {
    job: { title: string };
    seeker: { name: string | null };
  };
}

interface UpcomingInterviewsResponse {
  data: UpcomingInterviewItem[];
}

function formatInterviewDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
}

function formatInterviewTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' }) + ' UTC';
}

export function UpcomingInterviewsList() {
  const { data, isLoading, isError, refetch } = useQuery<UpcomingInterviewsResponse>({
    queryKey: ['recruiter-interviews-upcoming'],
    queryFn: async () => {
      const res = await fetch('/api/recruiter/interviews/upcoming');
      if (!res.ok) throw new Error('Failed to fetch interviews');
      return res.json() as Promise<UpcomingInterviewsResponse>;
    },
    staleTime: 30_000,
  });

  const interviews = data?.data ?? [];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Upcoming Interviews</h2>
          <p className="text-sm text-gray-500">Scheduled for this week</p>
        </div>
      </div>

      <div className="p-3">
        {isLoading && (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg mb-2">
              <div className="flex items-start justify-between mb-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))
        )}

        {!isLoading && isError && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">Could not load interviews.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry loading
            </Button>
          </div>
        )}

        {!isLoading && !isError && interviews.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">No upcoming interviews</p>
            <p className="text-xs text-gray-500">Schedule interviews from the candidate drawer.</p>
          </div>
        )}

        {!isLoading && !isError && interviews.length > 0 && (
          interviews.map((interview, index) => (
            <div
              key={interview.id}
              className={`p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                index !== interviews.length - 1 ? 'mb-2' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {interview.application.seeker.name ?? 'Candidate'}
                  </p>
                  <p className="text-xs text-gray-500">{interview.application.job.title}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10"
                  disabled={!interview.meetLink}
                  asChild={!!interview.meetLink}
                  aria-label={`Join meeting for ${interview.application.seeker.name ?? 'Candidate'}`}
                >
                  {interview.meetLink ? (
                    <a href={interview.meetLink} target="_blank" rel="noreferrer">
                      <Video className="w-4 h-4" />
                    </a>
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatInterviewDate(interview.startsAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatInterviewTime(interview.startsAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-100">
        <Button variant="ghost" className="w-full text-brand-primary font-medium">
          View All Interviews
        </Button>
      </div>
    </div>
  );
}
