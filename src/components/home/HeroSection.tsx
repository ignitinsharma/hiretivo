import { Button } from "@/components/ui/button";
import Link from "next/link";

/*
 * HeroSection
 * Dual-audience hero for talent marketplace homepage.
 * Left: recruiter CTA "Hire verified Indian engineers in 7 days"
 * Right: engineer CTA "Get a Hiretivo Verified ✓ badge"
 */
export function HeroSection() {
  return (
    <section className="bg-white px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Recruiter side */}
          <div className="flex flex-col gap-5">
            <span className="inline-block rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">
              For US/EU Startups
            </span>
            <h1 className="font-bold text-4xl leading-tight tracking-tight text-brand-foreground md:text-5xl">
              Hire verified Indian engineers in 7 days
            </h1>
            <p className="text-base text-brand-foreground-muted leading-relaxed">
              Browse pre-vetted engineers with Hiretivo Score, real USD salary
              expectations, and 4–8h US/EU timezone overlap. Unlock contact
              details and hire fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" asChild>
                <Link href="/auth/signup?role=recruiter">
                  Browse Engineers &rarr;
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>

          {/* Engineer side */}
          <div className="flex flex-col gap-5 rounded-xl border border-brand-border bg-brand-surface p-6 lg:p-8">
            <span className="inline-block rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">
              For Indian Engineers
            </span>
            <h2 className="font-bold text-3xl leading-tight tracking-tight text-brand-foreground md:text-4xl">
              Get a Hiretivo Verified &check; badge
            </h2>
            <p className="text-base text-brand-foreground-muted leading-relaxed">
              Submit your GitHub, projects, and video intro. Our team reviews
              and gives you a Hiretivo Score. Get discovered by US/EU startups
              paying USD salaries.
            </p>
            <Button variant="secondary" className="self-start" asChild>
              <Link href="/auth/signup?role=seeker">
                Apply for Verification &rarr;
              </Link>
            </Button>
            <ul className="flex flex-col gap-2 text-sm text-brand-foreground-muted">
              {[
                "No resume black holes",
                "USD salaries, remote-first",
                "48-hour review turnaround",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-brand-success">&check;</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
