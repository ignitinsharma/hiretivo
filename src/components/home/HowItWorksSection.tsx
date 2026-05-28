/*
 * HowItWorksSection
 * Fully static 3-step recruiter journey section for the homepage.
 * Renders a header and a 3-column grid (1 col mobile, 3 col desktop) showing
 * Browse → Unlock → Hire steps with icons, step numbers, and descriptions.
 * No props required.
 */

import { Search, Unlock, CheckCircle2, LucideIcon } from 'lucide-react'

interface Step {
  number: string
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Search,
    title: 'Browse',
    description:
      'Filter by skills, salary, and timezone. See Hiretivo Score before any call. No resume noise.',
  },
  {
    number: '02',
    icon: Unlock,
    title: 'Unlock',
    description:
      'One click reveals full name, email, GitHub, LinkedIn. No quota burned when engineers apply to you first.',
  },
  {
    number: '03',
    icon: CheckCircle2,
    title: 'Hire',
    description:
      'Schedule interview directly. Rate after hire — Hiretivo Score updates from real feedback.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="bg-white border-y border-brand-border py-20 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mb-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary mb-3">
          How it works
        </p>
        <h2 className="text-3xl font-bold text-brand-foreground md:text-4xl">
          From browse to hire in 3 steps
        </h2>
      </div>

      {/* Steps grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">
        {STEPS.map(({ number, icon: Icon, title, description }) => (
          <div key={number} className="flex flex-col items-start lg:items-center lg:text-center">
            {/* Step number */}
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-3">
              {number}
            </span>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
              <Icon className="h-5 w-5" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-brand-foreground mb-2">{title}</h3>

            {/* Description */}
            <p className="text-sm text-brand-foreground-muted leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
