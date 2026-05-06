import { CalendarClock } from "lucide-react";
import {
  detectBrowserTimezone,
  formatInterviewTimezoneDisplay,
} from "@/lib/timezone";

interface InterviewTimezoneDisplayProps {
  startsAt: string | Date | null;
  scheduledTimeZone?: string | null;
  viewerTimezone?: string | null;
  viewerLabel?: string;
  className?: string;
}

function parseDate(value: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function InterviewTimezoneDisplay({
  startsAt,
  scheduledTimeZone,
  viewerTimezone,
  viewerLabel = "Your time",
  className,
}: InterviewTimezoneDisplayProps) {
  const date = parseDate(startsAt);

  if (!date) {
    return (
      <div className={className}>
        <p className="text-sm font-medium text-brand-foreground-muted">TBD</p>
      </div>
    );
  }

  const display = formatInterviewTimezoneDisplay(
    date,
    scheduledTimeZone,
    viewerTimezone ?? detectBrowserTimezone(),
  );

  return (
    <div className={className}>
      <div className="flex items-start gap-2 text-sm">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <p className="break-words text-brand-foreground">
            <span className="font-semibold">Scheduled:</span>{" "}
            <span className="text-brand-foreground-muted">{display.scheduled}</span>
          </p>
          <p className="break-words text-brand-foreground">
            <span className="font-semibold">{viewerLabel}:</span>{" "}
            <span className="text-brand-foreground-muted">{display.viewer}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
