/*
 * EngineerCTASection
 * Engineer conversion CTA — "Get your Hiretivo badge. Free forever."
 * Layout: grid-backed CTA copy with verified profile/badge preview.
 * Fully static — no props, no data fetching.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BadgeCheck, Check, ShieldCheck, X } from 'lucide-react'

interface BeforeAfterRow {
  label: string
  before: string
  after: string
  beforePositive: boolean
  afterPositive: boolean
}

const BEFORE_AFTER_ROWS: BeforeAfterRow[] = [
  {
    label: 'Status',
    before: 'Not Verified',
    after: 'Hiretivo Verified ✓',
    beforePositive: false,
    afterPositive: true,
  },
  {
    label: 'Visibility',
    before: 'Low',
    after: 'High',
    beforePositive: false,
    afterPositive: true,
  },
  {
    label: 'Salary visible',
    before: 'No',
    after: 'Yes',
    beforePositive: false,
    afterPositive: true,
  },
]

/*
 * SignalRow
 * Compact before/after row used inside the proof cards.
 */
function SignalRow({ label, value, tone }: { label: string; value: string; tone: 'before' | 'after' }) {
  const isAfter = tone === 'after'

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
        isAfter
          ? 'border-brand-primary/15 bg-brand-primary/[0.035]'
          : 'border-brand-border bg-brand-surface'
      }`}
    >
      <span className="text-xs font-medium text-brand-foreground-muted">{label}</span>
      <span className={`text-right text-xs font-bold ${isAfter ? 'text-brand-success' : 'text-brand-danger'}`}>
        {value}
      </span>
    </div>
  )
}

/*
 * BadgeSignalBoard
 * Product proof-card board showing the verified profile signal before and after review.
 */
function BadgeSignalBoard() {
  return (
    <div className="grid-bg relative min-w-0 overflow-visible rounded-xl border border-brand-border bg-brand-surface p-4 md:p-6">
      <div className="absolute inset-0 rounded-xl bg-white/55" aria-hidden="true" />

      <div className="relative z-10 grid min-w-0 gap-4">
        <article className="group relative z-20 min-w-0 overflow-hidden rounded-xl border border-brand-primary/25 bg-white p-5 transition-all duration-500 ease-out [perspective:1000px] [transform-style:preserve-3d] hover:z-50 hover:-translate-y-1 hover:border-brand-primary/45 hover:[transform:rotateX(4deg)_rotateY(-5deg)_translateY(-4px)] md:mx-auto md:w-[82%] md:rotate-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none">
          <div className="flex items-start justify-between gap-4 transition-transform duration-500 [transform:translateZ(28px)] group-hover:[transform:translate3d(0,-2px,38px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-primary/20 bg-brand-primary/[0.06] text-lg font-bold text-brand-primary">
                HV
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-brand-foreground">Hiretivo Verified</p>
                <p className="text-xs text-brand-foreground-muted">Profile signal</p>
              </div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-brand-primary/20 bg-brand-primary/[0.035] p-4 transition-transform duration-500 [transform:translateZ(20px)] group-hover:[transform:translate3d(0,-1px,32px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
            <div className="flex items-center justify-between gap-4 border-b border-brand-primary/15 pb-3">
              <p className="text-[11px] font-bold uppercase tracking-[1.3px] text-brand-primary">
                Verification badge
              </p>
              <ShieldCheck className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-2">
              {BEFORE_AFTER_ROWS.map((row) => (
                <SignalRow key={row.label} label={row.label} value={row.after} tone="after" />
              ))}
            </div>
          </div>
        </article>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <article className="group relative z-10 min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white p-4 transition-all duration-500 ease-out [perspective:1000px] [transform-style:preserve-3d] hover:z-50 hover:-translate-y-1 hover:border-brand-danger/30 hover:[transform:rotateX(3deg)_rotateY(4deg)_translateY(-4px)] md:-rotate-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none">
            <div className="mb-3 flex items-center gap-2 text-brand-danger transition-transform duration-500 [transform:translateZ(20px)] group-hover:[transform:translate3d(0,-1px,30px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
              <X className="h-4 w-4" aria-hidden="true" />
              <p className="text-[11px] font-bold uppercase tracking-[1.2px]">Before</p>
            </div>
            <div className="grid gap-2 transition-transform duration-500 [transform:translateZ(16px)] group-hover:[transform:translate3d(0,-1px,26px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
              {BEFORE_AFTER_ROWS.map((row) => (
                <SignalRow key={row.before} label={row.label} value={row.before} tone="before" />
              ))}
            </div>
          </article>

          <article className="group relative z-10 min-w-0 overflow-hidden rounded-xl border border-brand-primary/25 bg-white p-4 transition-all duration-500 ease-out [perspective:1000px] [transform-style:preserve-3d] hover:z-50 hover:-translate-y-1 hover:border-brand-primary/45 hover:[transform:rotateX(4deg)_rotateY(-4deg)_translateY(-4px)] md:rotate-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none">
            <div className="mb-3 flex items-center gap-2 text-brand-primary transition-transform duration-500 [transform:translateZ(20px)] group-hover:[transform:translate3d(0,-1px,30px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
              <Check className="h-4 w-4" aria-hidden="true" />
              <p className="text-[11px] font-bold uppercase tracking-[1.2px]">After verification</p>
            </div>
            <div className="grid gap-2 transition-transform duration-500 [transform:translateZ(16px)] group-hover:[transform:translate3d(0,-1px,26px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
              {BEFORE_AFTER_ROWS.map((row) => (
                <SignalRow key={row.after} label={row.label} value={row.after} tone="after" />
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

/*
 * EngineerCTASection
 * Renders the full engineer conversion section with before/after cards,
 * centered heading, and verification CTA button.
 * @returns JSX section element — fully static
 */
export function EngineerCTASection() {
  return (
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl min-w-0">
        <div className="min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white lg:grid lg:grid-cols-[0.9fr_1.1fr]">

          {/* ── Left CTA copy ── */}
          <div className="grid-bg relative isolate flex flex-col justify-center overflow-hidden bg-brand-surface p-6 text-brand-foreground md:p-10 lg:p-12">
            <div className="absolute inset-0 bg-white/55" />
            <div className="absolute left-0 top-0 h-full w-1 bg-brand-primary" />

            <div className="relative z-10 min-w-0">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.6px] text-brand-primary">
                Are you an Indian engineer?
              </p>

              <h2 className="break-words text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Get your Hiretivo <span className="text-brand-primary">✓</span> badge.<br />
                Free forever.
              </h2>

              <p className="mt-5 max-w-md break-words text-base leading-relaxed text-brand-foreground-muted">
                Apply once, get reviewed, and show recruiters that your skills,
                salary range, and availability are already verified.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  variant="primary"
                  size="lg"
                >
                  <Link href="/seeker/verification">
                    Start Verification →
                  </Link>
                </Button>
                <p className="text-sm font-medium text-brand-foreground-secondary">
                  Takes ~10 minutes
                </p>
              </div>
            </div>
          </div>

          {/* ── Right proof preview ── */}
          <div className="bg-gradient-to-br from-white via-white to-brand-primary/[0.03] p-5 md:p-8 lg:p-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1.3px] text-brand-primary">
                  Profile signal
                </p>
                <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-brand-foreground">
                  Verification changes what recruiters see.
                </h3>
              </div>
            </div>
            <BadgeSignalBoard />
          </div>
        </div>
      </div>
    </section>
  )
}
