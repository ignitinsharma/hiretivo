import { Check, X } from "lucide-react";

/*
 * SeekerReadinessCard
 * Shows profile readiness with a progress bar and compact check/cross checklist.
 * Progress bar width uses inline style since Tailwind doesn't support dynamic percentages.
 */

interface SeekerReadinessCardProps {
  completedFields: string[];
  missingFields: string[];
  totalFields: number;
}

export function SeekerReadinessCard({
  completedFields,
  missingFields,
  totalFields,
}: SeekerReadinessCardProps) {
  if (totalFields === 0) return null;

  const completedCount = completedFields.length;
  const progressPercent =
    totalFields > 0 ? Math.round((completedCount / totalFields) * 100) : 0;

  return (
    <section className="rounded-xl border border-brand-border bg-white p-5">
      <h3 className="mb-3 font-semibold text-base leading-snug tracking-tight text-brand-foreground">
        Profile Readiness
      </h3>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-brand-foreground">
            {completedCount}/{totalFields} complete
          </span>
          <span className="text-brand-foreground-muted">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-brand-success transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {completedFields.map((field) => (
          <div
            key={field}
            className="flex items-center gap-1.5 text-xs text-brand-success"
          >
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>{field}</span>
          </div>
        ))}
        {missingFields.map((field) => (
          <div
            key={field}
            className="flex items-center gap-1.5 text-xs text-brand-danger"
          >
            <X className="h-3.5 w-3.5 shrink-0" />
            <span>{field}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
