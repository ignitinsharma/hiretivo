/*
 * WhyVerifiedSection
 * "The Hiretivo Standard" comparison section for the public homepage.
 * Left panel explains Hiretivo's proof signals; right panel compares traditional
 * hiring platforms with the Hiretivo verified standard.
 */

import {
  BadgeCheck,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  GitBranch,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Metric {
  icon: LucideIcon
  value: string
  label: string
}

interface ProofSignal {
  icon: LucideIcon
  label: string
}

interface ComparisonRow {
  icon: LucideIcon
  label: string
  traditional: string
  verified: string
}

interface ComparisonCellProps {
  description: string
  icon: LucideIcon
  label: string
  tone: 'traditional' | 'verified'
}

const METRICS: Metric[] = [
  { icon: TrendingDown, value: '<30%', label: 'Approval rate' },
  { icon: Clock3, value: '7 days', label: 'Average placement' },
  { icon: CircleDollarSign, value: 'USD', label: 'Salary transparency' },
]

const PROOF_SIGNALS: ProofSignal[] = [
  { icon: ShieldCheck, label: 'Identity verified' },
  { icon: BadgeCheck, label: 'Salary verified' },
  { icon: GitBranch, label: 'Real engineering proof' },
]

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    icon: UserRound,
    label: 'Anyone can sign up',
    traditional: 'Open sign-up with no screening',
    verified: 'Manually reviewed, <30% approved',
  },
  {
    icon: CircleDollarSign,
    label: 'Salary',
    traditional: 'Hidden salary expectations',
    verified: 'USD salary visible to both sides',
  },
  {
    icon: FileText,
    label: 'Hiring signal',
    traditional: 'Resume-based hiring',
    verified: 'Signal-based: GitHub + real projects',
  },
  {
    icon: ShieldCheck,
    label: 'Verification',
    traditional: 'Unverified profiles',
    verified: 'Admin-verified before going live',
  },
  {
    icon: Clock3,
    label: 'Speed',
    traditional: 'Slow time to hire',
    verified: '7-day average placement',
  },
]

/*
 * MetricCard
 * Renders one compact proof metric in the left narrative panel.
 * @param metric - Metric value, label, and supporting icon
 */
function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon

  return (
    <article className="min-w-0 rounded-xl border border-brand-border bg-brand-surface p-4 text-center transition-colors hover:border-brand-primary/35">
      <Icon className="mx-auto h-4 w-4 text-brand-primary" aria-hidden="true" />
      <p className="mt-3 break-words text-3xl font-bold leading-none tracking-tight text-brand-primary">
        {metric.value}
      </p>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[1.1px] text-brand-foreground-muted">
        {metric.label}
      </p>
    </article>
  )
}

/*
 * ProofSignalItem
 * Renders one verified Hiretivo proof signal in the connected signal rail.
 * @param signal - Signal label and supporting icon
 */
function ProofSignalItem({ signal }: { signal: ProofSignal }) {
  const Icon = signal.icon

  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-success/20 bg-brand-success/[0.06] text-brand-success">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="break-words text-sm font-semibold leading-snug text-brand-foreground">
        {signal.label}
      </span>
    </div>
  )
}

/*
 * ComparisonCell
 * Renders either the traditional or Hiretivo-verified side of a comparison row.
 * @param description - Explanatory comparison copy
 * @param icon - Traditional category icon; verified cells always use a check
 * @param label - Shared comparison topic
 * @param tone - Controls traditional or verified visual treatment
 */
function ComparisonCell({ description, icon: Icon, label, tone }: ComparisonCellProps) {
  const isVerified = tone === 'verified'

  return (
    <div
      className={cn(
        'flex min-w-0 items-start gap-3 p-4 transition-colors md:p-5',
        isVerified
          ? 'bg-brand-primary/[0.035] hover:bg-brand-primary/[0.06]'
          : 'bg-white hover:bg-brand-surface',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
          isVerified
            ? 'border-brand-primary/20 bg-white text-brand-primary'
            : 'border-brand-border bg-brand-surface text-brand-foreground-muted',
        )}
      >
        {isVerified ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0">
        <p
          className={cn(
            'text-[10px] font-bold uppercase tracking-[1px] sm:hidden',
            isVerified ? 'text-brand-primary' : 'text-brand-foreground-secondary',
          )}
        >
          {isVerified ? 'Hiretivo verified' : 'Traditional platforms'}
        </p>
        <h3 className="mt-1 break-words text-sm font-bold leading-snug text-brand-foreground sm:mt-0">
          {label}
        </h3>
        <p
          className={cn(
            'mt-1 break-words text-sm leading-relaxed',
            isVerified ? 'font-medium text-brand-foreground' : 'text-brand-foreground-muted',
          )}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

/*
 * ComparisonPair
 * Renders one responsive traditional-versus-verified comparison row.
 * @param row - Shared topic, descriptions, and category icon
 */
function ComparisonPair({ row }: { row: ComparisonRow }) {
  return (
    <article className="grid min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white transition-colors hover:border-brand-primary/30 sm:grid-cols-2">
      <div className="border-b border-brand-border sm:border-b-0 sm:border-r">
        <ComparisonCell
          description={row.traditional}
          icon={row.icon}
          label={row.label}
          tone="traditional"
        />
      </div>
      <ComparisonCell
        description={row.verified}
        icon={row.icon}
        label={row.label}
        tone="verified"
      />
    </article>
  )
}

/*
 * WhyVerifiedSection
 * Renders the responsive homepage comparison board with narrative proof,
 * metrics, verification signals, and five traditional-versus-verified rows.
 * @returns JSX section element with no client state or data fetching
 */
export function WhyVerifiedSection() {
  return (
    <section className="w-full max-w-full overflow-hidden border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-[calc(100vw-2rem)] min-w-0 md:max-w-7xl">
        <div className="grid w-full max-w-full min-w-0 gap-10 overflow-hidden rounded-xl border border-brand-border bg-white p-5 sm:p-7 lg:grid-cols-12 lg:gap-12 lg:p-10">
          <div className="flex w-full max-w-full min-w-0 flex-col overflow-hidden lg:col-span-5">
            <div className="flex items-center gap-2 text-brand-primary">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-[1.5px]">
                The Hiretivo Standard
              </p>
            </div>

            <h2 className="mt-6 max-w-full break-words text-3xl font-bold leading-[1.12] tracking-tight text-brand-foreground sm:text-4xl md:text-5xl">
              Why verified engineers are{' '}
              <span className="text-brand-primary">different.</span>
            </h2>

            <p className="mt-5 max-w-xl break-words text-base leading-relaxed text-brand-foreground-muted md:text-lg">
              Recruiters see fewer profiles, but each one carries stronger hiring
              signal: reviewed identity, visible salary, and real engineering proof.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {METRICS.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>

            <div className="mt-5 grid overflow-hidden rounded-xl border border-brand-border bg-white sm:grid-cols-3 sm:divide-x sm:divide-brand-border">
              {PROOF_SIGNALS.map((signal, index) => (
                <div
                  key={signal.label}
                  className={cn(index > 0 && 'border-t border-brand-border sm:border-t-0')}
                >
                  <ProofSignalItem signal={signal} />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-full min-w-0 overflow-hidden lg:col-span-7">
            <div className="mb-5 flex items-center gap-4">
              <span className="h-px flex-1 bg-brand-border" aria-hidden="true" />
              <p className="shrink-0 text-xs font-medium text-brand-foreground-muted">
                Common hiring noise
              </p>
              <span className="h-px flex-1 bg-brand-border" aria-hidden="true" />
            </div>

            <div className="mb-3 hidden grid-cols-2 gap-3 sm:grid">
              <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface px-5 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-foreground-muted">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs font-bold uppercase tracking-[1px] text-brand-foreground-muted">
                  Traditional platforms
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/[0.035] px-5 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-primary/20 bg-white text-brand-primary">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs font-bold uppercase tracking-[1px] text-brand-primary">
                  Hiretivo verified
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {COMPARISON_ROWS.map((row) => (
                <ComparisonPair key={row.label} row={row} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
