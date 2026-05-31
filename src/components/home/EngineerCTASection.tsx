/*
 * EngineerCTASection
 * Engineer conversion CTA — "Get your Hiretivo badge. Free forever."
 * Layout: before/after comparison cards flanking centered CTA copy.
 * Fully static — no props, no data fetching.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

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
 * BeforeCard
 * "Before Verification" state card — shows unverified profile metrics.
 */
function BeforeCard() {
  return (
    <div className="w-full rounded-xl border border-brand-danger/20 bg-white p-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.2px] text-brand-danger/70">
        Before
      </p>
      <div className="flex flex-col gap-3">
        {BEFORE_AFTER_ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 rounded-lg bg-brand-surface px-3 py-2.5">
            <p className="text-xs font-medium text-brand-foreground-muted">{row.label}</p>
            <div className="flex items-center gap-1.5">
              <X className="h-3.5 w-3.5 text-brand-danger" aria-hidden="true" />
              <span className="text-xs font-bold text-brand-danger">{row.before}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * AfterCard
 * "After Verification" state card — shows verified profile metrics.
 */
function AfterCard() {
  return (
    <div className="w-full rounded-xl border border-brand-primary/25 bg-white p-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.2px] text-brand-primary">
        After verification
      </p>
      <div className="flex flex-col gap-3">
        {BEFORE_AFTER_ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 rounded-lg bg-brand-primary/[0.04] px-3 py-2.5">
            <p className="text-xs font-medium text-brand-foreground-muted">{row.label}</p>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-brand-success" aria-hidden="true" />
              <span className="text-xs font-bold text-brand-success">{row.after}</span>
            </div>
          </div>
        ))}
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
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-xl border border-brand-border bg-white lg:grid lg:grid-cols-[0.9fr_1.1fr]">

          {/* ── Left CTA copy ── */}
          <div className="grid-bg relative isolate flex flex-col justify-center overflow-hidden bg-brand-surface p-6 text-brand-foreground md:p-10 lg:p-12">
            <div className="absolute inset-0 bg-white/55" />
            <div className="absolute left-0 top-0 h-full w-1 bg-brand-primary" />

            <div className="relative z-10">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.6px] text-brand-primary">
                Are you an Indian engineer?
              </p>

              <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Get your Hiretivo <span className="text-brand-primary">✓</span> badge.<br />
                Free forever.
              </h2>

              <p className="mt-5 max-w-md text-base leading-relaxed text-brand-foreground-muted">
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

          {/* ── Right proof cards ── */}
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
            <div className="grid gap-4 md:grid-cols-2">
              <BeforeCard />
              <AfterCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
