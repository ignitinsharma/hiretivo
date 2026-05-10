import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Building2,
  DollarSign,
  Globe2,
  Sparkles,
} from "lucide-react";
import { formatEnumLabel, formatSalaryRange } from "@/lib/home-page-utils";
import { resolveLogoUrl } from "@/lib/r2";

interface JobSkill {
  skill: {
    id: string;
    name: string;
    slug: string;
  };
}

interface RecruiterProfile {
  companyName: string | null;
  logo: string | null;
}

interface RecruiterWithProfile {
  recruiterProfile: RecruiterProfile | null;
}

interface FeaturedJob {
  id: string;
  title: string;
  jobType: string | null;
  workType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  category: string | null;
  skills: JobSkill[];
  recruiter: RecruiterWithProfile;
}

interface FeaturedJobsSectionProps {
  jobs: FeaturedJob[];
}

/*
 * FeaturedJobsSection
 * Renders the featured jobs grid with job cards from the database.
 * @param jobs - Array of featured jobs with relations
 */
export function FeaturedJobsSection({ jobs }: FeaturedJobsSectionProps) {
  return (
    <section
      className="bg-brand-surface py-20 md:py-24"
      data-purpose="featured-jobs"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-12">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-foreground">
              <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
              Fresh roles, checked daily
            </div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
              Latest Remote Jobs
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-foreground-muted md:text-lg">
              Hand-picked remote roles from teams hiring for real skills,
              not keyword-stuffed resumes.
            </p>
          </div>
          <Link
            className="hidden items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:border-brand-primary hover:text-brand-primary sm:inline-flex"
            href="/jobs"
          >
            View all jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-brand-border bg-white py-12 text-center text-brand-foreground-muted md:col-span-2 lg:col-span-3">
              No jobs available yet. Check back soon!
            </div>
          ) : (
            jobs.map((job) => {
              const profile = job.recruiter.recruiterProfile;
              const companyName = profile?.companyName ?? "Hiretivo";
              const logoUrl = resolveLogoUrl(profile?.logo);
              const jobType = formatEnumLabel(job.jobType);
              const workType = formatEnumLabel(job.workType);
              const salary = formatSalaryRange(
                job.salaryMin,
                job.salaryMax,
                job.currency,
              );

              return (
                <article
                  key={job.id}
                  className="group flex h-full min-h-67.5 flex-col rounded-xl border border-brand-border bg-white p-5 transition-colors hover:border-brand-primary"
                  data-purpose="job-card"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={`${companyName} logo`}
                            className="h-full w-full object-cover"
                            src={logoUrl}
                          />
                        ) : (
                          <span className="text-lg font-bold text-brand-primary">
                            {companyName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm capitalize font-semibold text-brand-foreground">
                          {companyName}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-foreground-muted">
                          <Globe2 className="h-3.5 w-3.5 text-brand-primary" />
                          <span>{workType ?? "Remote friendly"}</span>
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-foreground">
                      New
                    </span>
                  </div>

                  <Link href={`/jobs/${job.id}`} className="block">
                    <h3 className="text-xl capitalize font-semibold leading-snug tracking-tight text-brand-foreground transition-colors group-hover:text-brand-primary">
                      {job.title}
                    </h3>
                  </Link>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {jobType && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted">
                        <Clock3 className="h-3.5 w-3.5" />
                        {jobType}
                      </span>
                    )}
                    {job.category && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        {job.category}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 border-t border-brand-border pt-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-brand-foreground">
                        <DollarSign className="h-4 w-4 shrink-0 text-brand-primary" />
                        <span className="truncate">{salary}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-foreground-muted">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Direct company role</span>
                      </div>
                    </div>
                    <Link
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a47d9]"
                      href={`/jobs/${job.id}`}
                    >
                      View
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>
        <Link
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:border-brand-primary hover:text-brand-primary sm:hidden"
          href="/jobs"
        >
          View all jobs
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}