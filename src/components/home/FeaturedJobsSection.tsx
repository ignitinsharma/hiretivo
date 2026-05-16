import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { FakeJobCard, type FakeJob } from "@/components/shared/FakeJobCard";

const FEATURED_JOBS: FakeJob[] = [
  {
    id: "remote-fullstack",
    title: "Senior Full-Stack Engineer",
    companyName: "Hiretivo Labs",
    companyLogo: "https://logo.clearbit.com/vercel.com",
    workType: "Remote",
    jobType: "Full-time",
    category: "Engineering",
    salaryMin: 120000,
    salaryMax: 180000,
    currency: "USD",
    isNew: true,
  },
  {
    id: "platform-engineer",
    title: "Platform Engineer",
    companyName: "Northstar Cloud",
    companyLogo: "https://logo.clearbit.com/cloudflare.com",
    workType: "Remote",
    jobType: "Full-time",
    category: "Infrastructure",
    salaryMin: 110000,
    salaryMax: 165000,
    currency: "USD",
    isNew: false,
  },
  {
    id: "frontend-product",
    title: "Frontend Product Engineer",
    companyName: "SignalWorks",
    companyLogo: "https://logo.clearbit.com/linear.app",
    workType: "Remote",
    jobType: "Contract",
    category: "Product",
    salaryMin: 90000,
    salaryMax: 140000,
    currency: "USD",
    isNew: true,
  },
];

/*
 * FeaturedJobsSection
 * Renders the homepage demo jobs grid with a daily rotating fake job batch.
 */
export function FeaturedJobsSection() {
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
              Hand-picked remote roles from teams hiring for real skills, not
              keyword-stuffed resumes.
            </p>
          </div>
          <Link
            className="hidden items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:border-brand-primary hover:text-brand-primary sm:inline-flex"
            href="/seeker/login"
          >
            View all jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_JOBS.map((job) => (
            <FakeJobCard key={job.id} job={job} />
          ))}
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
