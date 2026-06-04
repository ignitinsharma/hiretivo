import type { SeekerOnboardingStep } from '@/modules/seeker-onboarding/types/seeker-onboarding.types'
import type { StrengthTier } from '@/lib/onboarding/profile-strength'

export interface StepRewardConfig {
  step: SeekerOnboardingStep
  whyCopy: string
  approvalTip: string
}

export const STEP_REWARD_CONFIG: Record<SeekerOnboardingStep, StepRewardConfig> = {
  1: {
    step: 1,
    whyCopy: 'So we match you to the right startups and timezones.',
    approvalTip: 'Engineers with location filled get 2× more relevant matches.',
  },
  2: {
    step: 2,
    whyCopy: 'Recruiters search the talent pool by exact skills.',
    approvalTip: 'Add 5+ skills to appear in more recruiter searches.',
  },
  3: {
    step: 3,
    whyCopy: 'This is what our reviewers check first. Strong proof = faster verification.',
    approvalTip: 'GitHub + 1 project → approval rate doubles vs. profiles without.',
  },
  4: {
    step: 4,
    whyCopy: 'Real work experience builds reviewer trust.',
    approvalTip: 'Profiles with work experience are approved 3× faster on average.',
  },
  5: {
    step: 5,
    whyCopy: 'Salary transparency on both sides — no wasted conversations.',
    approvalTip: 'USD salary + resume = profile complete and ready for review.',
  },
  6: {
    step: 6,
    whyCopy: 'Submit and our team reviews within 48 hours.',
    approvalTip: "Once verified, you're live and visible to recruiters immediately.",
  },
  7: {
    step: 7,
    whyCopy: 'Review complete.',
    approvalTip: '',
  },
}

export const TIER_MESSAGES: Record<StrengthTier, string> = {
  Starter: 'Keep going — fill more fields to improve approval odds',
  Basic: 'Getting there — add GitHub and projects next',
  Intermediate: 'Good progress — add work experience to reach Strong',
  Strong: 'Almost there — complete compensation to reach Expert',
  Expert: 'Profile is excellent — ready to submit!',
}
