/*
 * FeaturedEngineersSection
 * Verified engineer showcase — 3 manually curated engineer cards.
 * Each card: avatar, name, role, location, skills, availability, salary,
 * and proof signals.
 * Fully static — no props, no DB calls.
 */

import Link from 'next/link'
import { CircleDollarSign, Clock3, ShieldCheck } from 'lucide-react'
import { HiretivoVerifiedBadge } from '@/components/shared/HiretivoVerifiedBadge'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { FEATURED_ENGINEERS } from '@/config/home-page'
import type { FeaturedEngineer } from '@/config/home-page'
import { cn } from '@/lib/utils'

const ENGINEER_CARD_POSITIONS = [
  'md:-rotate-1',
  'md:translate-y-5 md:rotate-1',
  'md:-translate-y-2 md:-rotate-1',
] as const

/*
 * FeaturedEngineerCard
 * Single engineer card in the verified engineer grid.
 * Renders: avatar, name/years/verified, role, location, skills, availability,
 * salary, and proof signals.
 * @param engineer - FeaturedEngineer data object
 */
function FeaturedEngineerCard({ engineer, index }: { engineer: FeaturedEngineer; index: number }) {
  const salaryLabel = `$${(engineer.salaryMin / 1000).toFixed(0)}k – $${(engineer.salaryMax / 1000).toFixed(0)}k/yr USD`

  return (
    <div className="group min-w-0 [perspective:1000px]">
      <article
        className={cn(
          'relative flex min-h-[330px] min-w-0 flex-col gap-4 overflow-hidden rounded-xl border border-brand-border bg-white p-6 transition-all duration-500 ease-out [transform-style:preserve-3d] hover:-translate-y-1 hover:border-brand-primary/40 hover:[transform:rotateX(4deg)_rotateY(-5deg)_translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none',
          ENGINEER_CARD_POSITIONS[index],
        )}
      >

      {/* ── Row 1: Avatar + name + verified ── */}
      <div className="flex items-start gap-3 transition-transform duration-500 [transform:translateZ(24px)] group-hover:[transform:translate3d(0,-2px,34px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        <InitialsAvatar
          name={engineer.name}
          userId={engineer.id}
          fallbackSeed={engineer.initials}
          image={engineer.image}
          size="lg"
          verified={engineer.isVerified}
          className="shrink-0 bg-brand-surface"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-brand-foreground leading-tight">
              {engineer.name}
            </p>
            <span className="rounded-full bg-brand-surface border border-brand-border px-2 py-0.5 text-[10px] font-semibold text-brand-foreground-muted">
              {engineer.yearsExp}+ years
            </span>
            {engineer.isVerified && (
              <HiretivoVerifiedBadge variant="inline" size="sm" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-brand-foreground-muted">{engineer.role}</p>
        </div>
      </div>

      {/* ── Location ── */}
      <p className="-mt-1 text-xs text-brand-foreground-muted transition-transform duration-500 [transform:translateZ(18px)] group-hover:[transform:translate3d(0,-1px,28px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        {engineer.location} {engineer.locationFlag}
      </p>

      {/* ── Skills ── */}
      <div className="flex flex-wrap gap-1.5 transition-transform duration-500 [transform:translateZ(16px)] group-hover:[transform:translate3d(0,-1px,26px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        {engineer.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-brand-border bg-brand-surface px-2 py-0.5 text-[10px] font-semibold text-brand-foreground-muted"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* ── Availability ── */}
      <div className="flex items-center gap-1.5 transition-transform duration-500 [transform:translateZ(18px)] group-hover:[transform:translate3d(0,-1px,28px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        <span className="h-2 w-2 rounded-full bg-brand-success" aria-hidden="true" />
        <span className="text-xs font-semibold text-brand-success">Available Now</span>
      </div>

      {/* ── Salary ── */}
      <p className="-mt-1 break-words font-body text-xs font-semibold text-brand-foreground transition-transform duration-500 [transform:translateZ(18px)] group-hover:[transform:translate3d(0,-1px,28px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">{salaryLabel}</p>

      {/* ── Verified proof signals ── */}
      <div className="mt-auto grid min-w-0 gap-2 border-t border-brand-border pt-4 text-[10px] font-bold text-brand-foreground-muted transition-transform duration-500 [transform:translateZ(22px)] group-hover:[transform:translate3d(0,0,32px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
          Manually reviewed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CircleDollarSign className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
          Salary visible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
          Availability checked
        </span>
      </div>
      </article>
    </div>
  )
}

/*
 * FeaturedEngineersSection
 * Renders the verified engineer section with header, "View all" link,
 * and 3 featured engineer cards in a responsive grid.
 * @returns JSX section element — fully static
 */
export function FeaturedEngineersSection() {
  return (
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl min-w-0">

        {/* ── Header ── */}
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              Featured Engineers
            </p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
              Meet verified engineers.
            </h2>
          </div>
          <Link
            href="/recruiter/talent"
            className="text-sm font-semibold text-brand-primary hover:underline"
          >
            View all engineers →
          </Link>
        </div>

        {/* ── Engineer cards ── */}
        <div className="grid-bg min-w-0 overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-3 md:p-4">
          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            {FEATURED_ENGINEERS.map((engineer, index) => (
              <FeaturedEngineerCard key={engineer.id} engineer={engineer} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
