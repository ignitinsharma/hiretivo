/*
 * WhyVerifiedSection
 * "The Hiretivo Standard" — editorial split with proof panel and comparison table.
 * Table: Traditional Platforms (red X) vs Hiretivo (green checkmarks).
 * Fully static — no props, no data fetching.
 */

import { BadgeCheck, Check, GitBranch, ShieldCheck, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComparisonRow {
  label: string
  traditional: string
  hiretivo: string
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'Anyone can sign up',
    traditional: 'Anyone can sign up',
    hiretivo: 'Manually reviewed, <30% approved',
  },
  {
    label: 'Salary',
    traditional: 'Hidden salary expectations',
    hiretivo: 'USD salary visible to both sides',
  },
  {
    label: 'Hiring signal',
    traditional: 'Resume-based hiring',
    hiretivo: 'Signal-based: GitHub + real projects',
  },
  {
    label: 'Verification',
    traditional: 'Unverified profiles',
    hiretivo: 'Admin-verified before going live',
  },
  {
    label: 'Speed',
    traditional: 'Slow time to hire',
    hiretivo: '7-day average placement',
  },
]

const PROOF_SIGNALS = [
  { icon: ShieldCheck, label: 'Reviewed identity' },
  { icon: BadgeCheck, label: 'Visible salary' },
  { icon: GitBranch, label: 'Real engineering proof' },
] as const

/*
 * ComparisonProofCard
 * Compact product-proof comparison card replacing the tall desktop table.
 */
function ComparisonProofCard({ row, isWide }: { row: ComparisonRow; isWide: boolean }) {
  return (
    <article
      className={cn(
        'group min-w-0 rounded-xl border border-brand-border bg-white p-4 transition-all duration-500 ease-out [perspective:1000px] [transform-style:preserve-3d] hover:-translate-y-1 hover:border-brand-primary/40 hover:[transform:rotateX(4deg)_rotateY(-5deg)_translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none',
        isWide && 'lg:col-span-2',
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3 transition-transform duration-500 [transform:translateZ(24px)] group-hover:[transform:translate3d(0,-2px,34px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-brand-primary">
          {row.label}
        </p>
        <span className="h-px w-10 bg-brand-border transition-colors group-hover:bg-brand-primary/45" aria-hidden="true" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-brand-border bg-brand-surface p-3 transition-transform duration-500 [transform:translateZ(16px)] group-hover:[transform:translate3d(0,-1px,26px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
          <div className="mb-2 flex items-center gap-2 text-brand-danger">
            <X className="h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-[1px] text-brand-foreground-secondary">
              Traditional
            </p>
          </div>
          <p className="text-sm leading-snug text-brand-foreground-muted">
            {row.traditional}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border border-brand-primary/20 bg-brand-primary/[0.04] p-3 transition-transform duration-500 [transform:translateZ(20px)] group-hover:[transform:translate3d(0,-2px,30px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
          <div className="mb-2 flex items-center gap-2 text-brand-success">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-[1px] text-brand-primary">
              Hiretivo verified
            </p>
          </div>
          <p className="text-sm font-semibold leading-snug text-brand-foreground">
            {row.hiretivo}
          </p>
        </div>
      </div>
    </article>
  )
}

/*
 * WhyVerifiedSection
 * Renders the editorial comparison section with left proof panel and right table.
 * @returns JSX section element — fully static
 */
export function WhyVerifiedSection() {
  return (
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl min-w-0">
        <div className="grid-bg min-w-0 overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-3 md:p-4">
          <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[0.78fr_1.22fr]">

          {/* ── Left: editorial proof panel ── */}
          <div className="grid-bg group relative isolate min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white p-6 transition-all duration-500 ease-out [perspective:1000px] hover:border-brand-primary/35 md:p-8 lg:p-10 motion-reduce:transition-none">
            <div className="absolute inset-0 bg-white/70" aria-hidden="true" />
            <div className="absolute left-0 top-0 h-full w-1 bg-brand-primary" aria-hidden="true" />

            <div className="relative z-10 transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_rotateY(-2deg)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
            <p className="mb-4 text-xs font-bold uppercase tracking-[1.6px] text-brand-primary">
              The Hiretivo Standard
            </p>
            <h2 className="break-words text-4xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
              Why verified engineers are different.
            </h2>
            <p className="mt-5 break-words text-base leading-relaxed text-brand-foreground-muted">
              Recruiters see fewer profiles, but each one carries stronger hiring signal:
              reviewed identity, visible salary, and real engineering proof.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-brand-border bg-white p-5 transition-transform duration-500 [transform:translateZ(22px)] group-hover:[transform:translate3d(0,-2px,34px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                <p className="text-3xl font-bold leading-none tracking-tight text-brand-foreground">
                  &lt;30%
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[1.2px] text-brand-foreground-muted">
                  Approved
                </p>
              </div>
              <div className="rounded-xl border border-brand-border bg-white p-5 transition-transform duration-500 [transform:translateZ(18px)] group-hover:[transform:translate3d(0,2px,30px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                <p className="text-3xl font-bold leading-none tracking-tight text-brand-foreground">
                  7 days
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[1.2px] text-brand-foreground-muted">
                  Avg hire
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {PROOF_SIGNALS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-brand-border bg-white px-3 py-2.5 transition-transform duration-500 [transform:translateZ(14px)] group-hover:[transform:translate3d(0,-1px,24px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-brand-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* ── Right: compact comparison proof cards ── */}
          <div className="min-w-0 rounded-xl border border-brand-border bg-white p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-2 border-b border-brand-border pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-brand-foreground-muted">
                  Traditional platforms
                </p>
                <p className="mt-1 text-sm text-brand-foreground-muted">
                  Common hiring noise
                </p>
              </div>
              <div className="rounded-lg border border-brand-primary/20 bg-brand-primary/[0.04] px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-brand-primary">
                  Hiretivo ✓
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {COMPARISON_ROWS.map((row, index) => (
                <ComparisonProofCard
                  key={row.label}
                  row={row}
                  isWide={index === COMPARISON_ROWS.length - 1}
                />
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
