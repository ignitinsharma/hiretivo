import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, DollarSign, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_SHOWCASE, HOMEPAGE_DISPLAY_STATS } from "@/config/home-page";

interface CategoriesSectionProps {
  activeJobs: string;
}

/*
 * CategoriesSection
 * Renders the category showcase section with skill-based job discovery.
 * @param activeJobs - Number of active jobs to display
 */
export function CategoriesSection({ activeJobs }: CategoriesSectionProps) {
  return (
    <section
      className="overflow-hidden bg-white py-20 md:py-24"
      data-purpose="categories-section"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-sm font-semibold text-brand-foreground">
              <Sparkles className="h-4 w-4 text-brand-primary" />
              Skills-first discovery
            </div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
              <span className="block">Explore jobs</span>
              <span className="block">based on</span>
              <span className="block text-brand-primary">your skills</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-brand-foreground-muted">
              Explore high-paying remote roles across the industry&apos;s
              most in-demand categories.
            </p>
            <div className="mt-7 flex max-w-72 flex-col gap-3">
              <Button
                asChild
                variant="primary"
                size="lg"
                className="w-full"
              >
                <Link href="/jobs">
                  Find that job
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/seeker/register">Create profile</Link>
              </Button>
            </div>

            <div
              className="relative mt-10 hidden h-56 max-w-72 sm:block"
              aria-hidden="true"
            >
              <div className="absolute left-6 top-8 h-40 w-40 rounded-full border-2 border-brand-primary/25 bg-white" />
              <div className="absolute left-12 top-14 h-28 w-28 rounded-full border-4 border-brand-primary/20 bg-brand-surface" />
              <div className="absolute left-[78px] top-20 h-16 w-16 rounded-full bg-brand-primary" />
              <div className="absolute left-20 top-2 flex h-12 w-12 items-center justify-center rounded-full border border-brand-border bg-white text-sm font-bold text-brand-primary">
                NS
              </div>
              <div className="absolute left-0 top-20 flex h-12 w-12 items-center justify-center rounded-full border border-brand-border bg-white text-sm font-bold text-brand-primary">
                AR
              </div>
              <div className="absolute left-32 top-32 flex h-12 w-12 items-center justify-center rounded-full border border-brand-border bg-white text-sm font-bold text-brand-primary">
                KP
              </div>
              <div className="absolute left-40 top-8 flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary/25 bg-white text-brand-primary">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <Sparkles className="absolute left-48 top-0 h-5 w-5 text-brand-primary" />
              <Sparkles className="absolute bottom-4 left-8 h-4 w-4 text-brand-primary" />
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 md:p-5">
            <div className="rounded-xl border border-brand-border bg-white p-4 md:p-5">
              <div className="mb-5 flex flex-col gap-4 rounded-xl border border-brand-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.05em] text-brand-foreground-secondary">
                    Matched categories
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-brand-foreground">
                    Remote roles that fit your skills
                  </h3>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-brand-primary/20 bg-white px-3 py-2 text-sm font-semibold text-brand-primary">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {activeJobs} open jobs
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {CATEGORY_SHOWCASE.map(
                  ({ title, count, roles, salary, skills, icon: Icon }) => (
                    <Link
                      key={title}
                      href="/jobs"
                      className="group min-h-[248px] rounded-xl border border-brand-border bg-white p-5 transition-colors hover:border-brand-primary/50"
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-primary/10 bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-lg border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-foreground-muted">
                          {count}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold tracking-tight text-brand-foreground">
                        {title}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                        {roles}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-foreground">
                        <DollarSign className="h-4 w-4 text-brand-primary" />
                        {salary}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span
                            key={`${title}-${skill}`}
                            className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-foreground-muted"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ),
                )}
              </div>

              <div className="mt-5 rounded-xl border border-brand-primary/25 bg-white p-4 md:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold tracking-tight text-brand-foreground">
                        Not sure where to start?
                      </h4>
                      <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
                        Answer a few questions and we&apos;ll match you with
                        the best roles.
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="primary" className="shrink-0">
                    <Link href="/seeker/register">
                      <Sparkles className="h-4 w-4" />
                      Get matched
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}