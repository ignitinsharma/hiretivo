/*
 * StatsBarSection
 * Connected 5-metric proof rail displayed between hero and featured engineers.
 * Icons + large value + uppercase label per stat in one segmented container.
 * Fully static — no props, no data fetching.
 */

import { ShieldCheck, Clock, DollarSign, CalendarDays, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATS = [
  { icon: ShieldCheck, value: '500+', label: 'Verified Engineers' },
  { icon: Clock, value: '48 HRS', label: 'Review SLA' },
  { icon: DollarSign, value: 'USD', label: 'Salary Transparency' },
  { icon: CalendarDays, value: '7 Days', label: 'Avg Time to Hire' },
  { icon: TrendingDown, value: '~50%', label: 'Cost vs US Hires' },
] as const

const STAT_CARD_POSITIONS = [
  'lg:-rotate-1',
  'lg:translate-y-4 lg:rotate-1',
  'lg:-translate-y-2',
  'lg:translate-y-4 lg:-rotate-1',
  'lg:rotate-1',
] as const

/*
 * StatsBarSection
 * Renders the homepage metrics as a connected premium proof rail.
 * @returns JSX section element — fully static
 */
export function StatsBarSection() {
  return (
    <section className="border-y border-brand-border bg-white px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl min-w-0">
        <div className="grid-bg min-w-0 overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-3 md:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {STATS.map(({ icon: Icon, value, label }, index) => (
              <div key={label} className="min-w-0 [perspective:1000px]">
                <article
                  className={cn(
                    'group relative flex min-h-[158px] min-w-0 flex-col justify-between rounded-xl border border-brand-border bg-white p-5 transition-all duration-500 ease-out [transform-style:preserve-3d] hover:-translate-y-1 hover:border-brand-primary/40 hover:[transform:rotateX(4deg)_rotateY(-5deg)_translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none',
                    STAT_CARD_POSITIONS[index],
                  )}
                >
                  {index === 0 ? (
                    <span className="absolute inset-x-4 top-0 h-1 bg-brand-primary" aria-hidden="true" />
                  ) : null}
                  <div className="flex items-center justify-between transition-transform duration-500 [transform:translateZ(18px)] group-hover:[transform:translate3d(0,-2px,28px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="h-px w-8 bg-brand-border transition-colors group-hover:bg-brand-primary/45" />
                  </div>
                  <div className="mt-6 transition-transform duration-500 [transform:translateZ(24px)] group-hover:[transform:translate3d(0,-2px,34px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                    <span className="block text-4xl font-bold leading-none tracking-tight text-brand-foreground">
                      {value}
                    </span>
                    <span className="mt-3 block text-[11px] font-bold uppercase tracking-[1.4px] text-brand-foreground-muted">
                      {label}
                    </span>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
