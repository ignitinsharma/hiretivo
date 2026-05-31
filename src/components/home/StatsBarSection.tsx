/*
 * StatsBarSection
 * Full-width 5-column stats band displayed between hero and featured engineers.
 * Icons + large value + uppercase label per stat.
 * Fully static — no props, no data fetching.
 */

import { ShieldCheck, Clock, DollarSign, CalendarDays, TrendingDown } from 'lucide-react'

const STATS = [
  { icon: ShieldCheck, value: '500+', label: 'Verified Engineers' },
  { icon: Clock, value: '48 HRS', label: 'Review SLA' },
  { icon: DollarSign, value: 'USD', label: 'Salary Transparency' },
  { icon: CalendarDays, value: '7 Days', label: 'Avg Time to Hire' },
  { icon: TrendingDown, value: '~50%', label: 'Cost vs US Hires' },
] as const

/*
 * StatsBarSection
 * Renders the 4-column stats band with icon, value, and label per stat.
 * @returns JSX section element — fully static
 */
export function StatsBarSection() {
  return (
    <section className="border-y border-brand-border bg-brand-surface px-4 py-14 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 divide-x divide-brand-border/60 md:grid-cols-5">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2.5 px-6 py-2 text-center first:pl-0 last:pr-0"
            >
              <Icon className="h-6 w-6 text-brand-primary/70" aria-hidden="true" />
              <span className="font-display text-3xl font-bold tracking-[-0.03em] text-brand-foreground">
                {value}
              </span>
              <span className="font-body text-[10px] font-bold uppercase tracking-[1.5px] text-brand-foreground-muted">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
