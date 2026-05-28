/*
 * EngineerPreviewCard
 * Static, non-interactive preview card used exclusively on the homepage hero
 * to tease the verified Indian engineer marketplace to US/EU startup visitors.
 * Displays blurred-style locked profile info — no DB calls, no auth, no onClick.
 *
 * Props: EngineerPreviewCardProps (mirrors MockEngineerCard from src/config/home-page.ts,
 *        without the `id` field which is not needed for display).
 *
 * Rows:
 *   1. Avatar + name/role + verified badge + Hiretivo score
 *   2. Skills pills (max 3 shown, overflow as "+N more")
 *   3. Salary range / timezone overlap / available-from detail items
 *   4. Locked CTA div (disabled appearance, no interaction)
 */

import { Lock, DollarSign, Clock, Calendar } from 'lucide-react'

/*
 * EngineerPreviewCardProps
 * Matches the shape of MockEngineerCard from src/config/home-page.ts (minus `id`).
 */
interface EngineerPreviewCardProps {
  firstName: string
  lastInitial: string
  isVerified: boolean
  hiretivoScore: number
  role: string
  yearsExp: number
  skills: readonly string[]
  salaryMin: number
  salaryMax: number
  timezoneOverlapHours: number
  availableFrom: string
}

/** Max number of skill pills to render before showing an overflow count */
const MAX_VISIBLE_SKILLS = 3

/*
 * EngineerPreviewCard
 * Renders a single static engineer preview card for the homepage hero section.
 * @param props - EngineerPreviewCardProps
 * @returns JSX card element — fully static, no side-effects
 */
export function EngineerPreviewCard({
  firstName,
  lastInitial,
  isVerified,
  hiretivoScore,
  role,
  skills,
  salaryMin,
  salaryMax,
  timezoneOverlapHours,
  availableFrom,
}: EngineerPreviewCardProps) {
  const initials = `${firstName[0]}${lastInitial[0]}`.toUpperCase()
  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS)
  const overflowCount = skills.length - MAX_VISIBLE_SKILLS

  const salaryLabel = `$${(salaryMin / 1000).toFixed(0)}k–$${(salaryMax / 1000).toFixed(0)}k/yr`
  const overlapLabel = `${timezoneOverlapHours}+ hrs US overlap`

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 flex flex-col gap-4">
      {/* ── Row 1: Avatar + name/role + verified badge + score ── */}
      <div className="flex items-center gap-3">
        {/* Initials avatar */}
        <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-foreground leading-tight truncate">
            {firstName} {lastInitial}
          </p>
          <p className="text-xs text-brand-foreground-muted truncate">{role}</p>
        </div>

        {/* Verified badge + score */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isVerified && (
            <span className="bg-brand-primary/10 text-brand-primary text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
              ✓ Verified
            </span>
          )}
          <span className="text-xs font-bold text-brand-foreground">
            {hiretivoScore}/100
          </span>
        </div>
      </div>

      {/* ── Row 2: Skills pills ── */}
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-0.5 text-xs font-medium text-brand-foreground-muted"
          >
            {skill}
          </span>
        ))}
        {overflowCount > 0 && (
          <span className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-0.5 text-xs font-medium text-brand-foreground-muted">
            +{overflowCount} more
          </span>
        )}
      </div>

      {/* ── Row 3: Detail items (salary, timezone, availability) ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1 text-xs text-brand-foreground-muted">
          <DollarSign className="w-3 h-3 shrink-0" aria-hidden="true" />
          {salaryLabel}
        </span>
        <span className="flex items-center gap-1 text-xs text-brand-foreground-muted">
          <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
          {overlapLabel}
        </span>
        <span className="flex items-center gap-1 text-xs text-brand-foreground-muted">
          <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
          {availableFrom}
        </span>
      </div>

      {/* ── Row 4: Locked CTA (static div, not a Button component) ── */}
      <div
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-border text-brand-foreground-muted text-sm py-2 cursor-not-allowed opacity-70 select-none"
        aria-disabled="true"
        role="button"
        tabIndex={-1}
      >
        <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Unlock Profile
      </div>
    </div>
  )
}
