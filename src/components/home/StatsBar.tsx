interface StatsBarProps {
  activeJobs: string;
  companiesHiring: string;
  jobSeekers: string;
}

/*
 * StatsBar
 * Renders the statistics bar showing key platform metrics.
 * @param activeJobs - Number of active jobs
 * @param companiesHiring - Number of companies hiring
 * @param jobSeekers - Number of job seekers
 */
export function StatsBar({ activeJobs, companiesHiring, jobSeekers }: StatsBarProps) {
  return (
    <section
      className="border-y border-brand-border bg-white py-10 md:py-12"
      data-purpose="stats-bar"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
          <div>
            <div className="mb-2 text-3xl font-bold text-brand-foreground md:text-4xl">
              {activeJobs}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted md:text-sm">
              Active Jobs
            </div>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-brand-foreground md:text-4xl">
              {companiesHiring}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted md:text-sm">
              Companies Hiring
            </div>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-brand-foreground md:text-4xl">
              {jobSeekers}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted md:text-sm">
              Job Seekers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
