/*
 * HeroRecruiterSection
 * White minimal hero — two-column layout.
 * Left: badge, headline, subtext, CTA, inline quality stats.
 * Right: cascading overlapping engineer preview cards (absolute positioned stack).
 * Server component — no client state, no interactive handlers.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_ENGINEER_CARDS } from "@/config/home-page";
import { EngineerPreviewCard } from "@/components/home/EngineerPreviewCard";

/*
 * HeroRecruiterSection
 * Renders the full-width white hero with left copy and right cascading card stack.
 * No props — all content from config constants.
 */
export function HeroRecruiterSection() {
  const [primaryEngineer, secondaryEngineer, tertiaryEngineer] =
    MOCK_ENGINEER_CARDS;

  return (
    <section className="dot-grid relative overflow-hidden bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_520px]">
        {/* ── LEFT: copy ── */}
        <div>
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-1.5">
            <span
              className="text-xs font-bold text-brand-primary"
              aria-hidden="true"
            >
              ✓
            </span>
            <span className="text-xs font-semibold text-brand-foreground-muted">
              500+ Verified Indian Engineers
            </span>
          </div>

          {/* H1 */}
          <h1 className="mb-5 font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-brand-foreground md:text-[60px]">
            Hire engineers
            <br />
            you can <span className="italic text-brand-primary">trust.</span>
          </h1>

          {/* Subtext */}
          <p className="mb-8 max-w-[420px] text-base leading-[1.7] text-brand-foreground-muted">
            Every engineer is manually reviewed, GitHub-scored, and
            salary-transparent before you see them.
          </p>

          {/* Primary CTA */}
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="primary" size="lg">
              <Link href="/recruiter/register">
                Browse Talent Pool
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-brand-foreground-muted">
              Are you an engineer?{" "}
              <Link
                href="/seeker/verification"
                className="font-semibold text-brand-primary hover:underline"
              >
                Get verified free →
              </Link>
            </p>
          </div>
        </div>

        {/* ── RIGHT: cascading card stack ── */}
        <div className="hidden lg:block">
          <div
            className="group/cards relative h-[500px] [perspective:900px]"
            aria-hidden="true"
          >
            {/* Soft radial glow behind the stack */}
            <div className="absolute -left-10 top-0 h-[430px] w-[470px] rounded-full opacity-35 blur-2xl transition-transform duration-500 [background:#7560FF] [background:radial-gradient(circle,rgba(117,96,255,1)_0%,rgba(148,187,233,1)_100%)] group-hover/cards:scale-105" />
            <div className="absolute left-24 top-28 h-[300px] w-[360px] rounded-full opacity-20 blur-3xl [background:radial-gradient(circle,rgba(117,96,255,1)_0%,rgba(148,187,233,1)_100%)]" />

            {/* Card 1 — top, fully visible */}
            <div className="absolute left-0 top-0 z-30 w-[360px] -rotate-2 [transform-style:preserve-3d] transition-transform duration-500 ease-out will-change-transform hover:z-50 hover:[transform:translate3d(-10px,-12px,34px)_rotateX(6deg)_rotateY(9deg)_rotateZ(-3deg)] motion-reduce:transition-none motion-reduce:hover:transform-none">
              <EngineerPreviewCard
                displayName={primaryEngineer.displayName}
                firstName={primaryEngineer.firstName}
                lastInitial={primaryEngineer.lastInitial}
                isVerified={primaryEngineer.isVerified}
                hiretivoScore={primaryEngineer.hiretivoScore}
                role={primaryEngineer.role}
                yearsExp={primaryEngineer.yearsExp}
                skills={primaryEngineer.skills}
                salaryMin={primaryEngineer.salaryMin}
                salaryMax={primaryEngineer.salaryMax}
                timezoneOverlapHours={primaryEngineer.timezoneOverlapHours}
                availableFrom={primaryEngineer.availableFrom}
                highlighted
                blurLevel="none"
                className="bg-white/95"
              />
            </div>

            {/* Card 2 — offset down and right */}
            <div className="absolute left-11 top-[132px] z-20 w-[360px] rotate-3 [transform-style:preserve-3d] transition-transform duration-500 ease-out will-change-transform hover:z-50 hover:[transform:translate3d(12px,-6px,34px)_rotateX(-4deg)_rotateY(-10deg)_rotateZ(4deg)] motion-reduce:transition-none motion-reduce:hover:transform-none">
              <EngineerPreviewCard
                displayName={secondaryEngineer.displayName}
                firstName={secondaryEngineer.firstName}
                lastInitial={secondaryEngineer.lastInitial}
                isVerified={secondaryEngineer.isVerified}
                hiretivoScore={secondaryEngineer.hiretivoScore}
                role={secondaryEngineer.role}
                yearsExp={secondaryEngineer.yearsExp}
                skills={secondaryEngineer.skills}
                salaryMin={secondaryEngineer.salaryMin}
                salaryMax={secondaryEngineer.salaryMax}
                timezoneOverlapHours={secondaryEngineer.timezoneOverlapHours}
                availableFrom={secondaryEngineer.availableFrom}
                highlighted={false}
                blurLevel="none"
                className="bg-white/95"
              />
            </div>

            {/* Card 3 — lower stack card, still readable and hoverable */}
            <div className="absolute left-20 top-[264px] z-10 w-[360px] -rotate-2 [transform-style:preserve-3d] transition-transform duration-500 ease-out will-change-transform hover:z-50 hover:[transform:translate3d(18px,-4px,34px)_rotateX(-5deg)_rotateY(-8deg)_rotateZ(2deg)] motion-reduce:transition-none motion-reduce:hover:transform-none">
              <EngineerPreviewCard
                displayName={tertiaryEngineer.displayName}
                firstName={tertiaryEngineer.firstName}
                lastInitial={tertiaryEngineer.lastInitial}
                isVerified={tertiaryEngineer.isVerified}
                hiretivoScore={tertiaryEngineer.hiretivoScore}
                role={tertiaryEngineer.role}
                yearsExp={tertiaryEngineer.yearsExp}
                skills={tertiaryEngineer.skills}
                salaryMin={tertiaryEngineer.salaryMin}
                salaryMax={tertiaryEngineer.salaryMax}
                timezoneOverlapHours={tertiaryEngineer.timezoneOverlapHours}
                availableFrom={tertiaryEngineer.availableFrom}
                highlighted={false}
                blurLevel="none"
                className="bg-white/95"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
