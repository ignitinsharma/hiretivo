import { format, parse } from "date-fns";

/*
 * SeekerWorkHistoryCard
 * Displays work history as a vertical timeline with dots and connecting lines.
 * Returns null when no work history is submitted.
 */

interface WorkExperience {
  company: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string | null;
  isCurrent: boolean;
}

interface SeekerWorkHistoryCardProps {
  experiences: WorkExperience[] | null | undefined;
}

function formatWorkDate(value: Date | string | null): string {
  if (!value) return "Not provided";
  if (typeof value === "string" && /^\d{2}\/\d{4}$/.test(value)) {
    return format(parse(value, "MM/yyyy", new Date()), "MMM yyyy");
  }
  return format(new Date(value), "MMM yyyy");
}

export function SeekerWorkHistoryCard({
  experiences,
}: SeekerWorkHistoryCardProps) {
  if (!experiences?.length) return null;

  return (
    <section className="rounded-xl border border-brand-border bg-white p-5">
      <h3 className="mb-4 font-semibold text-base leading-snug tracking-tight text-brand-foreground">
        Work History
      </h3>
      <div className="relative">
        {experiences.map((work, index) => {
          const isLast = index === experiences.length - 1;
          return (
            <div
              key={`${work.company}-${work.title}-${index}`}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <div className="z-10 h-3 w-3 rounded-full border-2 border-brand-primary bg-white" />
                {!isLast && <div className="mt-0 h-full w-px bg-gray-200" />}
              </div>
              {/* Content */}
              <div className="-mt-0.5 min-w-0 flex-1">
                <p className="text-sm font-medium text-brand-foreground">
                  {work.title ?? "Untitled Role"}
                </p>
                <p className="text-sm text-brand-foreground-muted">
                  {work.company ?? "Unknown company"}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-brand-foreground-secondary">
                  <span>
                    {formatWorkDate(work.startDate)} &mdash;{" "}
                    {work.isCurrent ? "Present" : formatWorkDate(work.endDate)}
                  </span>
                  {work.isCurrent && (
                    <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Current
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
