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
      className="bg-white border-y border-gray-200 py-12"
      data-purpose="stats-bar"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-black text-4xl font-bold mb-2">
              {activeJobs}
            </div>
            <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">
              Active Jobs
            </div>
          </div>
          <div>
            <div className="text-black text-4xl font-bold mb-2">
              {companiesHiring}
            </div>
            <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">
              Companies Hiring
            </div>
          </div>
          <div>
            <div className="text-black text-4xl font-bold mb-2">
              {jobSeekers}
            </div>
            <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">
              Job Seekers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}