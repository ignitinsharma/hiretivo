import { JobStatus } from "@/constants/enums";
import { cn } from "@/lib/utils";

const DEFAULT_LABEL: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: "Draft",
  [JobStatus.OPEN]: "Open",
  [JobStatus.PAUSED]: "Paused",
  [JobStatus.CLOSED]: "Closed",
  [JobStatus.UNPUBLISHED]: "Unpublished",
  [JobStatus.DELETED]: "Deleted",
};

const COLOR_CLASS: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: "bg-brand-surface text-brand-foreground-muted",
  [JobStatus.OPEN]: "bg-green-100 text-green-700",
  [JobStatus.PAUSED]: "bg-amber-100 text-amber-700",
  [JobStatus.CLOSED]: "bg-brand-surface text-brand-foreground-muted",
  [JobStatus.UNPUBLISHED]: "bg-brand-surface text-brand-foreground-secondary",
  [JobStatus.DELETED]: "bg-red-100 text-red-700",
};

interface JobStatusBadgeProps {
  status: JobStatus;
  label?: string;
  className?: string;
}

/*
 * JobStatusBadge
 * Shared pill badge for job statuses across admin + recruiter views.
 * @param status - Job status enum
 * @param label - Optional override; defaults to title-cased status
 * @param className - Optional extra classes
 */
export function JobStatusBadge({ status, label, className }: JobStatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-2 py-1 rounded-md text-xs font-medium",
        COLOR_CLASS[status] ?? "",
        className,
      )}
    >
      {label ?? DEFAULT_LABEL[status] ?? status}
    </span>
  );
}
