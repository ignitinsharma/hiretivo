/*
 * EngineerPreviewCard
 * Dark-themed static preview card for the homepage hero.
 * First card is highlighted (purple border, full opacity).
 * Cards 2+ are progressively blurred to tease the talent pool.
 * No DB calls, no interaction — purely decorative / trust signal.
 */

import { Lock, DollarSign, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  highlighted?: boolean
  blurLevel?: 'none' | 'medium' | 'heavy'
}

const MAX_VISIBLE_SKILLS = 3

/*
 * EngineerPreviewCard
 * Renders a single static engineer preview card for the dark homepage hero.
 * @param highlighted - true for first card (purple border accent)
 * @param blurLevel - 'none' | 'medium' (blur) | 'heavy' (blur + opacity)
 */
export function EngineerPreviewCard({
  firstName,
  lastInitial,
  isVerified,
  hiretivoScore,
  role,
  yearsExp,
  skills,
  salaryMin,
  salaryMax,
  timezoneOverlapHours,
  availableFrom,
  highlighted = false,
  blurLevel = 'none',
}: EngineerPreviewCardProps) {
  const initials = `${firstName[0]}${lastInitial[0]}`.toUpperCase()
  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS)
  const overflowCount = skills.length - MAX_VISIBLE_SKILLS
  const salaryLabel = `$${(salaryMin / 1000).toFixed(0)}k–$${(salaryMax / 1000).toFixed(0)}k/yr`
  const overlapLabel = `${timezoneOverlapHours}+ hrs US overlap`

  return (
    <div
      className={cn(
        'rounded-xl border bg-[#111] p-4 flex flex-col gap-3',
        highlighted ? 'border-brand-primary/25' : 'border-white/[0.07]',
        blurLevel === 'medium' && 'blur-[3.5px]',
        blurLevel === 'heavy' && 'blur-[3.5px] opacity-50',
      )}
    >
      {/* ── Row 1: Avatar + name/role + score ── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-xs font-bold text-brand-primary shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#e8e8e8] leading-tight truncate">
            {firstName} {lastInitial} · {yearsExp} yrs
          </p>
          <p className="text-xs text-white/35 truncate">{role}</p>
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-lg font-bold text-brand-primary leading-none tracking-tight">
            {hiretivoScore}
          </span>
          <span className="text-[9px] text-white/20 font-medium">/ 100</span>
        </div>
      </div>

      {/* ── Row 2: Verified badge ── */}
      {isVerified && (
        <div className="flex">
          <span className="inline-flex items-center gap-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded">
            ✓ Hiretivo Verified
          </span>
        </div>
      )}

      {/* ── Row 3: Skills pills ── */}
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/30"
          >
            {skill}
          </span>
        ))}
        {overflowCount > 0 && (
          <span className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/30">
            +{overflowCount}
          </span>
        )}
      </div>

      {/* ── Row 4: Meta (salary, overlap, availability) ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-[10px] text-white/25">
          <DollarSign className="w-3 h-3 shrink-0" aria-hidden="true" />
          {salaryLabel}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-white/25">
          <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
          {overlapLabel}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-white/25">
          <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
          {availableFrom}
        </span>
      </div>

      {/* ── Row 5: Locked CTA ── */}
      <div
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/[0.07] text-white/20 text-[11px] font-semibold py-2 cursor-not-allowed select-none"
        aria-disabled="true"
        role="button"
        tabIndex={-1}
      >
        <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
        Unlock Full Profile
      </div>
    </div>
  )
}
