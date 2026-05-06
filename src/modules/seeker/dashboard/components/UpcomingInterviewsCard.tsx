"use client";

import { Calendar, Video } from "lucide-react";
import { InterviewTimezoneDisplay } from "@/components/shared/InterviewTimezoneDisplay";
import { useFetchSeekerInterviews } from "../queries/use-fetch-seeker-interviews";
import type { SeekerInterview } from "../types/dashboard.types";

const CARD_CLASSES = "bg-white rounded-xl border border-gray-200 p-6";

const SECTION_TITLE_CLASSES = "text-xl font-semibold text-foreground";

function InterviewRow({ interview }: { interview: SeekerInterview }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-b-0 last:pb-0 first:pt-0">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <Calendar className="w-5 h-5 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground capitalize">
          {interview.companyName}
        </p>
        <p className="text-sm text-muted-foreground font-medium mt-0.5">
          {interview.jobTitle}
        </p>
        <div className="mt-2 space-y-3">
          <InterviewTimezoneDisplay
            startsAt={interview.startsAt}
            scheduledTimeZone={interview.scheduledTimeZone}
            viewerTimezone={interview.viewerTimezone}
          />
          {interview.meetLink && (
            <a
              href={interview.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1 text-sm font-medium text-brand-primary transition-colors hover:underline"
            >
              <Video className="w-4 h-4" />
              Join Meeting
            </a>
          )}
        </div>
        {interview.notes && (
          <p className="mt-2 text-sm capitalize text-gray-400 line-clamp-2">
            {interview.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export function UpcomingInterviewsCard() {
  const { data: interviews, isLoading, isError } = useFetchSeekerInterviews();

  if (isLoading || isError || !interviews || interviews.length === 0) {
    return null;
  }

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
