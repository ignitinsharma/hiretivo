import { format } from "date-fns";

interface QuotaDisplayProps {
  used: number;
  total: number | null; // null = unlimited
  resetAt: Date | null;
}

/*
 * QuotaDisplay
 * Shows recruiter's unlock quota usage for the current billing period.
 * Renders "X / Y unlocks used" or "Unlimited unlocks" for SCALE plan.
 */
export function QuotaDisplay({ used, total, resetAt }: QuotaDisplayProps) {
  if (total === null) {
    return (
      <div className="flex items-center gap-1 text-sm text-brand-foreground-muted">
        <span className="text-brand-success font-medium">Unlimited</span>
        <span>unlocks</span>
      </div>
    );
  }

  const exhausted = used >= total;
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <div className="flex items-center gap-1">
        <span className={exhausted ? "font-medium text-brand-danger" : "font-medium text-brand-foreground"}>
          {used} / {total}
        </span>
        <span className="text-brand-foreground-muted">profile unlocks used this period</span>
      </div>
      {exhausted && resetAt && (
        <p className="text-xs text-brand-foreground-secondary">
          Resets {format(resetAt, "MMM d, yyyy")}
        </p>
      )}
    </div>
  );
}
