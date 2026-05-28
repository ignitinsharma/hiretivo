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
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-brand-foreground md:text-4xl">
            From browse to hire in 3 steps
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-0">
          {/* Connecting gradient line — desktop only */}
          <div
            className="pointer-events-none absolute left-[calc(16.66%+20px)] right-[calc(16.66%+20px)] top-5 hidden h-px bg-gradient-to-r from-brand-border via-brand-primary/50 to-brand-border lg:block"
            aria-hidden="true"
          />

          {STEPS.map(({ number, icon: Icon, title, description, isPrimary }) => (
            <div key={number} className="flex flex-col gap-5 lg:pr-10 lg:last:pr-0">
              {/* Step number box */}
              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
                  isPrimary ? 'bg-brand-primary' : 'bg-brand-foreground'
                }`}
              >
                {number}
              </div>

              {/* Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-primary">
                <Icon className="h-5 w-5" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold tracking-tight text-brand-foreground">
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
