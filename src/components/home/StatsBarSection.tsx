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
 * Renders the homepage metrics as compact premium tiles.
 * @returns JSX section element — fully static
 */
export function StatsBarSection() {
  return (
    <section className="border-y border-brand-border bg-white px-4 py-12 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="group flex min-h-[150px] flex-col justify-between rounded-xl border border-brand-border bg-white p-5 transition-colors hover:border-brand-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="h-px w-8 bg-brand-border transition-colors group-hover:bg-brand-primary/35" />
              </div>
              <div>
                <span className="block font-display text-4xl font-bold leading-none tracking-tight text-brand-foreground">
                  {value}
                </span>
                <span className="mt-3 block font-body text-[11px] font-bold uppercase tracking-[1.4px] text-brand-foreground-muted">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
