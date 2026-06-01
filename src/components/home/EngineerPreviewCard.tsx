/*
 * EngineerPreviewCard
 * Light-themed static preview card for the homepage hero card stack.
 * First card highlighted (purple border). Cards 2+ progressively blurred.
 * Avatar gradient unique per engineer initial. Shows verified badge, skills,
 * salary + green-dot availability, and locked unlock CTA.
 * No DB calls, no interaction — purely decorative trust signal.
 */

import { Lock, DollarSign } from 'lucide-react'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { cn } from '@/lib/utils'

interface EngineerPreviewCardProps {
  id?: string
  displayName?: string
  firstName: string
  lastInitial: string
  image?: string | null
  isVerified: boolean
  hiretivoScore: number
  role: string
  yearsExp: number
  skills: readonly string[]
  salaryMin: number
  salaryMax: number
  timezoneOverlapHours: number
  availableFrom: string
  highlighted?: boolean
  blurLevel?: 'none' | 'medium' | 'heavy'
  className?: string
}

const MAX_VISIBLE_SKILLS = 4

/*
 * EngineerPreviewCard
 * Renders one engineer preview card for the hero cascading stack.
 * @param highlighted - true for first card (purple border accent)
 * @param blurLevel - 'none' | 'medium' | 'heavy' progressive blur
 */
export function EngineerPreviewCard({
  id,
  displayName,
  firstName,
  lastInitial,
  image,
  isVerified,
  hiretivoScore,
  role,
  skills,
  salaryMin,
  salaryMax,
  availableFrom,
  highlighted = false,
  blurLevel = 'none',
  className,
}: EngineerPreviewCardProps) {
  const seed = `${firstName}${lastInitial.replace('.', '')}`

  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS)
  const salaryLabel = `$${(salaryMin / 1000).toFixed(0)}k–$${(salaryMax / 1000).toFixed(0)}k / yr`
  const isAvailableNow = availableFrom === 'Available Now' || availableFrom === 'Immediate'
  const nameLabel = displayName ?? `${firstName} ${lastInitial.replace('.', '')}`

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border bg-white p-3.5',
        highlighted ? 'border-brand-primary/35' : 'border-brand-border',
        blurLevel === 'medium' && 'blur-[0.8px] opacity-95',
        blurLevel === 'heavy' && 'blur-[1.5px] opacity-80',
        className,
      )}
    >
      {/* ── Row 1: Avatar + name/role/verified + score ── */}
      <div className="flex items-start gap-3">
        <InitialsAvatar
          name={nameLabel}
          userId={id}
          fallbackSeed={seed}
          image={image}
          size="lg"
          className="shrink-0 bg-brand-surface"
        />

        {/* Name + role + verified */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold leading-tight tracking-tight text-brand-foreground">
            {nameLabel}
          </p>
          <p className="mt-0.5 truncate font-body text-[11px] leading-snug text-brand-foreground-muted">
            {role}
          </p>

          {isVerified && (
            <div className="mt-2 flex">
              <span className="inline-flex items-center gap-1 rounded-md border border-brand-primary/20 bg-brand-primary/[0.08] px-2 py-0.5 text-[10px] font-bold leading-none text-brand-primary">
                ✓ Hiretivo Verified
              </span>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex shrink-0 flex-col items-end">
          <div className="flex items-baseline gap-0.5 font-display leading-none">
            <span className="text-xl font-bold tracking-tight text-brand-primary">
              {hiretivoScore}
            </span>
            <span className="text-[10px] font-semibold text-brand-foreground-secondary">
              /100
            </span>
          </div>
          <span className="mt-0.5 font-body text-[8px] font-bold text-brand-foreground-secondary">
            Score
          </span>
        </div>
      </div>

      {/* ── Row 2: Skills pills ── */}
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-brand-border bg-brand-surface px-2 py-0.5 font-body text-[10px] font-semibold text-brand-foreground-muted"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* ── Row 3: Salary + availability ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1 font-body text-[10px] font-medium text-brand-foreground-muted">
          <DollarSign className="h-3 w-3 shrink-0" aria-hidden="true" />
          {salaryLabel}
        </span>
        <span className="flex items-center gap-1.5 font-body text-[10px] font-bold text-brand-success">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-success" aria-hidden="true" />
          {isAvailableNow ? 'Available Now' : availableFrom}
        </span>
      </div>

      {/* ── Row 4: Locked CTA ── */}
      <div
        className="flex w-full cursor-not-allowed select-none items-center justify-center gap-2 rounded-lg border border-brand-border bg-white py-2 font-body text-[10px] font-semibold text-brand-foreground-secondary"
        aria-disabled="true"
        role="button"
        tabIndex={-1}
      >
        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
        Unlock Full Profile
      </div>
    </div>
  )
}
