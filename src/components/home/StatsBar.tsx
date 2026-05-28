import { HOMEPAGE_STATS } from '@/config/home-page'

/*
 * StatsBar
 * Displays 4 quality-signal stats that highlight the verified marketplace advantage
 * Shows approval rate, review SLA, salary visibility, and time-to-hire metrics
 * Grid: 2 columns mobile, 4 columns desktop
 */
export function StatsBar() {
  return (
    <section
      className="border-y border-brand-border bg-white py-10 md:py-12"
      data-purpose="stats-bar"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {HOMEPAGE_STATS.map(stat => (
            <div key={stat.label}>
              <div className="mb-1 text-3xl font-bold tracking-tight text-brand-foreground md:text-4xl">
                {stat.value}
              </div>
              <div className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
