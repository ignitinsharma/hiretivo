import { Button } from "@/components/ui/button";
import { Lock, Search, ShieldCheck, WalletCards } from "lucide-react";
import Link from "next/link";

/*
 * HeroSection
 * Recruiter-first homepage hero with product workflow preview.
 */
export function HeroSection() {
  return (
    <section className="grid-bg bg-white px-4 pt-16 md:px-8 md:pt-24">
      <div className="mx-auto max-w-6xl pb-12 md:pb-16">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">
            For US/EU startups hiring in India
          </span>
          <h1 className="mt-5 font-bold text-5xl leading-tight tracking-tight text-brand-foreground md:text-6xl lg:text-7xl">
            Hire verified Indian engineers in 7 days
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-foreground-muted md:text-lg">
            Browse hand-reviewed engineers with Hiretivo Score, salary
            transparency, and timezone overlap. Unlock Talent Pool profiles when
            you are ready to contact candidates.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button variant="primary" asChild>
              <Link href="/auth/signup?role=recruiter">Browse engineers</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/auth/signup?role=seeker">Get verified as an engineer</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-brand-border bg-white">
          <div className="grid gap-0 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Verified evidence",
                body: "GitHub, projects, work history, skills, and profile clarity reviewed before discovery.",
              },
              {
                icon: WalletCards,
                title: "Salary transparency",
                body: "Recruiters see expected compensation and availability before starting outreach.",
              },
              {
                icon: Lock,
                title: "Talent Pool unlock",
                body: "FREE accounts see the locked product. Paid plans unlock browsing and contact details.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="border-b border-brand-border p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <Icon className="h-5 w-5 text-brand-primary" />
                  <h2 className="mt-3 text-base font-semibold text-brand-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-brand-border bg-brand-surface p-4">
            <div className="flex items-center gap-3 text-sm text-brand-foreground-muted">
              <Search className="h-4 w-4 text-brand-primary" />
              <span>Filter by role, skills, salary, availability, and overlap.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
