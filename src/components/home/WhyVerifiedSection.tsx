/*
 * WhyVerifiedSection
 * "The Hiretivo Standard" — split layout: heading on left, comparison table on right.
 * Table: Traditional Platforms (red X) vs Hiretivo (green checkmarks).
 * Fully static — no props, no data fetching.
 */

import { X, Check } from 'lucide-react'

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

/*
 * WhyVerifiedSection
 * Renders the split comparison section with left heading and right comparison table.
 * @returns JSX section element — fully static
 */
export function WhyVerifiedSection() {
  return (
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.35fr] lg:items-center">

          {/* ── Left: heading ── */}
          <div className="max-w-md">
            <p className="mb-4 text-xs font-bold uppercase tracking-[1.6px] text-brand-primary">
              The Hiretivo Standard
            </p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
              Why verified engineers are different.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-brand-foreground-muted">
              Recruiters see fewer profiles, but each one carries stronger hiring signal:
              reviewed identity, visible salary, and real engineering proof.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                <p className="font-display text-2xl font-bold leading-none tracking-tight text-brand-foreground">
                  &lt;30%
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[1.2px] text-brand-foreground-muted">
                  Approved
                </p>
              </div>
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                <p className="font-display text-2xl font-bold leading-none tracking-tight text-brand-foreground">
                  7 days
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[1.2px] text-brand-foreground-muted">
                  Avg hire
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: comparison table ── */}
          <div>
            <div className="hidden overflow-hidden rounded-xl border border-brand-border bg-white lg:block">

              {/* Table header */}
              <div className="grid grid-cols-2">
                <div className="border-b border-r border-brand-border bg-brand-surface px-6 py-4">
                  <p className="text-xs font-bold uppercase tracking-[1px] text-brand-foreground-muted">
                    Traditional Platforms
                  </p>
                </div>
                <div className="border-b border-brand-border bg-brand-foreground px-6 py-4">
                  <p className="text-xs font-bold uppercase tracking-[1px] text-white">
                    Hiretivo ✓
                  </p>
                </div>
              </div>

              {/* Comparison rows */}
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-2 ${i < COMPARISON_ROWS.length - 1 ? 'border-b border-brand-border' : ''}`}
                >
                  {/* Traditional — red X + text */}
                  <div className="flex items-start gap-4 border-r border-brand-border px-6 py-5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-danger/15 bg-brand-danger/[0.04]">
                      <X
                        className="h-4 w-4 text-brand-danger"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <p className="font-body text-[11px] font-bold uppercase tracking-[1px] text-brand-foreground-secondary">
                        {row.label}
                      </p>
                      <p className="mt-1 font-body text-sm leading-snug text-brand-foreground-muted">
                        {row.traditional}
                      </p>
                    </div>
                  </div>

                  {/* Hiretivo — green check + text */}
                  <div className="flex items-start gap-4 bg-brand-primary/[0.035] px-6 py-5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-success/15 bg-brand-success/[0.06]">
                      <Check
                        className="h-4 w-4 text-brand-success"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <p className="font-body text-[11px] font-bold uppercase tracking-[1px] text-brand-primary">
                        Verified standard
                      </p>
                      <p className="mt-1 font-body text-sm font-semibold leading-snug text-brand-foreground">
                        {row.hiretivo}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:hidden">
              {COMPARISON_ROWS.map((row) => (
                <div key={row.label} className="rounded-xl border border-brand-border bg-white p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[1px] text-brand-primary">
                    {row.label}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border border-brand-border bg-brand-surface p-3">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-brand-danger" aria-hidden="true" />
                      <p className="text-sm leading-snug text-brand-foreground-muted">{row.traditional}</p>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-brand-primary/20 bg-brand-primary/[0.04] p-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-success" aria-hidden="true" />
                      <p className="text-sm font-semibold leading-snug text-brand-foreground">{row.hiretivo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
              </div>
      </div>
    </section>
  )
}
