/*
 * HeroRecruiterSection
 * White minimal hero — two-column layout.
 * Left: badge, headline, subtext, CTA, inline quality stats.
 * Right: cascading overlapping engineer preview cards (absolute positioned stack).
 * Server component — no client state, no interactive handlers.
 */

import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleDollarSign, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_ENGINEER_CARDS } from "@/config/home-page";
import { EngineerPreviewCard } from "@/components/home/EngineerPreviewCard";
import { DecorativeUnderline } from "./EngineerCTASection";

/*
 * HeroRecruiterSection
 * Renders the full-width white hero with left copy and right cascading card stack.
 * No props — all content from config constants.
 */
export function HeroRecruiterSection() {
  const [primaryEngineer, secondaryEngineer, tertiaryEngineer] =
    MOCK_ENGINEER_CARDS;

  return (
    <section className="grid-bg relative overflow-hidden bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto grid max-w-7xl min-w-0 items-center gap-14 lg:grid-cols-[1fr_520px]">
        {/* ── LEFT: copy ── */}
        <div className="min-w-0">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-1.5">
            <BadgeCheck
              className="h-3.5 w-3.5 text-brand-primary"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-brand-foreground-muted">
              500+ manually verified Indian engineers
            </span>
          </div>

          {/* H1 */}
          <h1 className="mb-5 break-words font-display text-5xl font-bold leading-[1.06] tracking-[-0.03em] text-brand-foreground md:text-6xl">
            Hire{" "}
            <span className="relative inline-block text-brand-primary">
              verified
              <DecorativeUnderline className="absolute -bottom-3 left-0 h-3 w-full text-brand-primary/70" />
            </span>
            <br />
            engineers you can <br />
            trust.
          </h1>

          {/* Subtext */}
          <p className="mb-5 max-w-115 break-words text-base leading-relaxed text-brand-foreground-muted">
            Every engineer is manually reviewed, GitHub-scored, and
            salary-transparent before you see them.
          </p>

          <div className="mb-8 flex max-w-130 flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-foreground-muted">
              <BadgeCheck
                className="h-3.5 w-3.5 text-brand-primary"
                aria-hidden="true"
              />
              Manual review
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-foreground-muted">
              <Github
                className="h-3.5 w-3.5 text-brand-primary"
                aria-hidden="true"
              />
              GitHub score
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-foreground-muted">
              <CircleDollarSign
                className="h-3.5 w-3.5 text-brand-primary"
                aria-hidden="true"
              />
              Salary upfront
            </span>
          </div>

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
            {/* Card 1 — top, fully visible */}
            <div className="absolute left-0 top-0 z-30 w-[360px] -rotate-2 [transform-style:preserve-3d] transition-transform duration-500 ease-out will-change-transform hover:z-50 hover:[transform:translate3d(-10px,-12px,34px)_rotateX(6deg)_rotateY(9deg)_rotateZ(-3deg)] motion-reduce:transition-none motion-reduce:hover:transform-none">
              <EngineerPreviewCard
                id={primaryEngineer.id}
                displayName={primaryEngineer.displayName}
                firstName={primaryEngineer.firstName}
                lastInitial={primaryEngineer.lastInitial}
                image={primaryEngineer.image}
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
                id={secondaryEngineer.id}
                displayName={secondaryEngineer.displayName}
                firstName={secondaryEngineer.firstName}
                lastInitial={secondaryEngineer.lastInitial}
                image={secondaryEngineer.image}
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
                id={tertiaryEngineer.id}
                displayName={tertiaryEngineer.displayName}
                firstName={tertiaryEngineer.firstName}
                lastInitial={tertiaryEngineer.lastInitial}
                image={tertiaryEngineer.image}
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
