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
    whyCopy: 'Recruiters check these first. LinkedIn and GitHub are the #1 signal for reviewer trust.',
    approvalTip: 'Profiles with LinkedIn + GitHub get 3× more recruiter views.',
  },
  2: {
    step: 2,
    whyCopy: 'We parse your resume to auto-fill your profile and kickstart AI-powered tailoring.',
    approvalTip: 'A parsed resume lets you generate tailored applications in one click.',
  },
}

export const TIER_MESSAGES: Record<StrengthTier, string> = {
  Starter: 'Fill in your details to get started.',
  Basic: 'Add your LinkedIn and GitHub to boost recruiter confidence.',
  Intermediate: 'Almost done! Upload your resume next.',
  Strong: 'Your profile looks good — submit when ready.',
  Expert: 'Profile is excellent — ready to submit!',
}
