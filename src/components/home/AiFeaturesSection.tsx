/*
 * AiFeaturesSection
 * "Powered by AI" glimpse for the public homepage. The left column states the
 * thesis (AI handles the busywork) and lists the three AI tools; the right
 * column is a realistic, static AI Candidate Summary card with a performance
 * sparkline, scoring metrics, and a screening question. Mirrors the real
 * ai-summary output shape. No client state or data fetching — all content static.
 */

import {
  BadgeCheck,
  Briefcase,
  Check,
  Copy,
  FileText,
  MapPin,
  Sparkles,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface AiFeature {
  icon: LucideIcon
  title: string
  description: string
}

interface MetricStat {
  label: string
  value: string
}

const AI_FEATURES: AiFeature[] = [
  {
    icon: Sparkles,
    title: 'AI Candidate Summary',
    description: 'Instant fit score, skill match, and screening questions.',
  },
  {
    icon: FileText,
    title: 'Instant JD Generator',
    description: 'Create compelling job descriptions in seconds.',
  },
  {
    icon: Target,
    title: 'Smart Skill Extraction',
    description: 'Auto-extract must-have skills from any job description.',
  },
]

const MATCHING_SKILLS = ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js'] as const

const METRICS: MetricStat[] = [
  { label: 'Experience', value: '3.6 / 5' },
  { label: 'Skills', value: '8.5 / 10' },
  { label: 'Role', value: '9 / 10' },
  { label: 'Potential', value: 'High' },
]

const SUBLABEL = 'text-xs font-bold uppercase tracking-[1.1px] text-brand-foreground-secondary'

/*
 * FeatureItem
 * Renders one recruiter AI tool row in the left column.
 * @param feature - Tool title, one-line benefit, and supporting icon
 */
function FeatureItem({ feature }: { feature: AiFeature }) {
  const Icon = feature.icon

  return (
    <article className="flex min-w-0 items-center gap-4 rounded-2xl border border-brand-border bg-white/70 p-4 transition-colors hover:border-brand-primary/40 hover:bg-white">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/[0.08] text-brand-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="break-words font-semibold text-brand-foreground">{feature.title}</p>
        <p className="break-words text-sm text-brand-foreground-muted">{feature.description}</p>
      </div>
    </article>
  )
}

/*
 * PerformanceSparkline
 * Static decorative SVG line chart showing a candidate's signal trend across
 * evaluation dimensions. Scales responsively via its viewBox.
 */
function PerformanceSparkline() {
  return (
    <svg
      viewBox="0 0 580 130"
      className="w-full text-brand-primary"
      role="img"
      aria-label="Candidate signal trend across evaluation dimensions"
    >
      <path
        d="M10,100 C45,100 45,70 80,70 C115,70 115,85 150,85 C185,85 185,45 220,45 C255,45 255,62 290,62 C325,62 325,30 360,30 C395,30 395,58 430,58 C465,58 465,38 500,38 C535,38 535,52 570,52 L570,130 L10,130 Z"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <path
        d="M10,100 C45,100 45,70 80,70 C115,70 115,85 150,85 C185,85 185,45 220,45 C255,45 255,62 290,62 C325,62 325,30 360,30 C395,30 395,58 430,58 C465,58 465,38 500,38 C535,38 535,52 570,52"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {[
        [10, 100],
        [80, 70],
        [150, 85],
        [220, 45],
        [290, 62],
        [360, 30],
        [430, 58],
        [500, 38],
        [570, 52],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="white" stroke="currentColor" strokeWidth="2.5" />
      ))}
    </svg>
  )
}

/*
 * CandidateSummaryCard
 * Static, realistic AI Candidate Summary proof artifact — verified candidate,
 * overall match, matching skills, signal sparkline, scoring metrics, and a
 * screening question. All values are illustrative and mirror the real output.
 */
function CandidateSummaryCard() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/[0.08] text-brand-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="break-words font-semibold text-brand-foreground">AI Candidate Summary</p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-success" aria-hidden="true" />
          Analyzed 2 min ago
        </span>
      </div>

      <div className="space-y-6 p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ai-candidate.jpg"
                alt="Arjun Patel"
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl object-cover"
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-primary text-white">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
              </span>
            </span>
            <div className="min-w-0">
              <h3 className="break-words text-lg font-semibold text-brand-foreground">Arjun Patel</h3>
              <p className="break-words text-sm text-brand-foreground-muted">Senior Frontend Engineer</p>
              <div className="mt-2 space-y-1">
                <p className="flex items-center gap-1.5 text-sm text-brand-foreground-muted">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Bengaluru, India
                </p>
                <p className="flex items-center gap-1.5 text-sm text-brand-foreground-muted">
                  <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
                  3.6 years of experience
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div className="sm:text-right">
              <p className="text-3xl font-bold leading-none text-brand-foreground">92%</p>
              <p className="mt-1 text-xs text-brand-foreground-muted">Overall Match</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-success/20 bg-brand-success/[0.08] px-3 py-1 text-xs font-medium text-brand-success">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Excellent Fit
            </span>
          </div>
        </div>

        <div>
          <p className={SUBLABEL}>Top matching skills</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MATCHING_SKILLS.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-medium text-brand-foreground"
              >
                <Check className="h-3.5 w-3.5 text-brand-success" aria-hidden="true" />
                {skill}
              </span>
            ))}
            <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-foreground-muted">
              + 4 more
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-brand-surface/60 px-2 pt-4">
          <PerformanceSparkline />
          <div className="grid grid-cols-2 gap-y-4 border-t border-brand-border px-3 py-4 sm:grid-cols-4">
            {METRICS.map((metric) => (
              <div key={metric.label} className="min-w-0">
                <p className="break-words text-[11px] text-brand-foreground-muted">{metric.label}</p>
                <p className="break-words text-base font-bold text-brand-foreground">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/[0.035] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-primary/20 bg-white text-brand-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[1.1px] text-brand-primary">
                AI Screening Question
              </p>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-primary/20 bg-white text-brand-primary">
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 break-words text-sm leading-relaxed text-brand-foreground">
            Walk me through a system you scaled and the trade-offs you made.
          </p>
        </div>
      </div>
    </div>
  )
}

/*
 * AiFeaturesSection
 * Renders the responsive "Powered by AI" homepage section pairing the recruiter
 * value thesis and tool list with a realistic candidate-summary proof card.
 * @returns JSX section element with no client state or data fetching
 */
export function AiFeaturesSection() {
  return (
    <section className="w-full max-w-full overflow-hidden border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-[calc(100vw-2rem)] min-w-0 md:max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-br from-brand-primary/[0.06] via-white to-brand-primary/[0.04] p-6 sm:p-8 lg:p-12">
          <div className="grid w-full max-w-full min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-14">
            <div className="flex w-full max-w-full min-w-0 flex-col">
              <span className="inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Powered by AI
              </span>

              <h2 className="mt-6 break-words text-4xl font-bold leading-[1.1] tracking-tight text-brand-foreground sm:text-5xl">
                AI handles the busywork.{' '}
                <span className="text-brand-primary">You hire the best.</span>
              </h2>

              <p className="mt-6 max-w-sm break-words text-base leading-relaxed text-brand-foreground-muted">
                Hiretivo scans, evaluates, and shortlists the right candidates so you can focus
                on what really matters.
              </p>

              <div className="mt-8 space-y-3">
                {AI_FEATURES.map((feature) => (
                  <FeatureItem key={feature.title} feature={feature} />
                ))}
              </div>
            </div>

            <div className="w-full max-w-full min-w-0">
              <CandidateSummaryCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
