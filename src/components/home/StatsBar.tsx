interface StatsBarProps {
  count: string;
}

export function StatsBar({ count }: StatsBarProps) {
  return (
    <section
      className="border-y border-brand-border bg-white py-12 md:py-16"
      data-purpose="stats-bar"
    >
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className="mb-2 text-5xl font-bold text-brand-foreground md:text-6xl">
          {count}
        </div>
        <div className="text-sm font-medium uppercase tracking-wider text-brand-foreground-muted">
          Verified Engineers — Hand-Reviewed &amp; Scored
        </div>
      </div>
    </section>
  );
}
