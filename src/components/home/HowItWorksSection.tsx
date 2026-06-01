/*
 * HowItWorksSection
 * White-background 3-step recruiter journey section.
 * Numbered squares (purple step 1, dark steps 2–3) connected by a
 * gradient horizontal line. Desktop: 3-column grid. Mobile: stacked.
 * No props — fully static.
 */

import { LucideIcon, Search, Unlock, CheckCircle2 } from 'lucide-react'

interface Step {
  number: string
  icon: LucideIcon
  title: string
  description: string
  isPrimary: boolean
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Search,
    title: 'Browse',
    description:
      'Filter by skills, salary, and timezone. See Hiretivo Score before any call. No resume noise.',
    isPrimary: true,
  },
  {
    number: '02',
    icon: Unlock,
    title: 'Unlock',
    description:
      'One click reveals full name, email, GitHub, LinkedIn. No quota burned when engineers apply to you first.',
    isPrimary: false,
  },
  {
    number: '03',
    icon: CheckCircle2,
    title: 'Hire',
    description:
      'Schedule interview directly. Rate after hire — Hiretivo Score updates from real feedback.',
    isPrimary: false,
  },
]

/*
 * HowItWorksSection
 * Renders the 3-step recruiter journey with numbered step boxes and a
 * gradient connecting line between them.
 */
export function HowItWorksSection() {
  return (
    <section className="border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
            From browse to hire in 3 steps
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Connecting line — desktop only, sits at the circle center */}
          <div
            className="pointer-events-none absolute left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] top-8 hidden h-px border-t border-dashed border-brand-primary/25 lg:block"
            aria-hidden="true"
          />

          {STEPS.map(({ number, icon: Icon, title, description, isPrimary }) => (
            <div key={number} className="relative rounded-xl border border-brand-border bg-white p-6">
              <div className="mb-8 flex items-center justify-between">
                {/* Step number circle */}
                <div
                  className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    isPrimary ? 'bg-brand-primary' : 'bg-brand-foreground'
                  }`}
                >
                  {number}
                </div>

                {/* Icon box */}
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold tracking-tight text-brand-foreground">
                {title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed text-brand-foreground-muted">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
