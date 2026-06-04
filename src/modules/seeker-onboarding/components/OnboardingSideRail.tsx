'use client'

import { ShieldCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ProfileStrengthResult, StrengthTier } from '@/lib/onboarding/profile-strength'
import { STEP_REWARD_CONFIG, TIER_MESSAGES } from '@/modules/seeker-onboarding/data/onboarding-rewards'
import type { SeekerOnboardingStep } from '@/modules/seeker-onboarding/types/seeker-onboarding.types'

/*
 * OnboardingSideRail
 * Sticky side rail shown during seeker onboarding.
 * Displays live profile strength, next recommended action, and a "why we ask" tip
 * for the current step. Updates reactively as the user fills their profile.
 *
 * @param strength - Computed profile strength from computeOnboardingStrength()
 * @param step     - Current onboarding step (1–7)
 */

interface OnboardingSideRailProps {
  strength: ProfileStrengthResult
  step: SeekerOnboardingStep
}

const TIER_BADGE_CLASSES: Record<StrengthTier, string> = {
  Starter:      'bg-gray-100 text-gray-600',
  Basic:        'bg-yellow-100 text-yellow-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Strong:       'bg-orange-100 text-orange-700',
  Expert:       'bg-green-100 text-green-700',
}

/* StrengthCard — profile strength meter with tier badge and progress bar */
function StrengthCard({ strength }: { strength: ProfileStrengthResult }) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-primary" />
          <span className="font-semibold text-sm text-brand-foreground">Profile Strength</span>
        </div>
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-lg',
            TIER_BADGE_CLASSES[strength.tier],
          )}
        >
          {strength.tier}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-brand-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-500"
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
        <span className="font-bold text-sm text-brand-primary tabular-nums w-10 text-right">
          {strength.percentage}%
        </span>
      </div>

      <p className="text-xs text-brand-foreground-muted leading-snug">
        {TIER_MESSAGES[strength.tier]}
      </p>
    </div>
  )
}

/* NextStepCard — surfaces the nextAction tip unless profile is submit-ready */
function NextStepCard({ nextAction }: { nextAction: string }) {
  const isSubmitReady = nextAction.startsWith('Your profile is strong')
  if (isSubmitReady) return null

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
        Next step
      </p>
      <p className="text-sm font-medium text-brand-foreground leading-snug">{nextAction}</p>
    </div>
  )
}

/* WhyWeAskCard — explains why the current step data matters */
function WhyWeAskCard({ step }: { step: SeekerOnboardingStep }) {
  const config = STEP_REWARD_CONFIG[step]
  return (
    <div className="rounded-xl border border-brand-border p-4 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
        Why we ask
      </p>
      <p className="text-sm text-brand-foreground-muted leading-snug">{config.whyCopy}</p>
    </div>
  )
}

export function OnboardingSideRail({ strength, step }: OnboardingSideRailProps) {
  return (
    <div className="space-y-4">
      <StrengthCard strength={strength} />
      <NextStepCard nextAction={strength.nextAction} />
      <WhyWeAskCard step={step} />
    </div>
  )
}
