export type StrengthTier = 'Starter' | 'Basic' | 'Intermediate' | 'Strong' | 'Expert'

export interface ProfileStrengthResult {
  percentage: number
  tier: StrengthTier
  nextAction: string
  filledWeight: number
}

export function computeOnboardingStrength(state: {
  step1: { name: string; phone: string; linkedinUrl: string; githubUrl: string | null; portfolioUrl: string | null; situation: string | null }
  step3: { resume: unknown | null }
}): ProfileStrengthResult {
  let filledWeight = 0

  if (state.step1.name.trim()) filledWeight += 12
  if (state.step1.phone.trim()) filledWeight += 12
  if (state.step1.linkedinUrl.trim()) filledWeight += 12
  if (state.step1.githubUrl?.trim()) filledWeight += 12
  if (state.step1.portfolioUrl?.trim()) filledWeight += 12
  if (state.step1.situation) filledWeight += 20
  if (state.step3.resume) filledWeight += 20

  const percentage = Math.min(100, filledWeight)

  const tier: StrengthTier =
    percentage <= 20
      ? 'Starter'
      : percentage <= 40
        ? 'Basic'
        : percentage <= 60
          ? 'Intermediate'
          : percentage <= 80
            ? 'Strong'
            : 'Expert'

  let nextAction: string
  if (!state.step1.situation) {
    nextAction = 'Tell us your current situation to get started'
  } else if (!state.step1.name.trim()) {
    nextAction = 'Enter your full name'
  } else if (!state.step1.phone.trim()) {
    nextAction = 'Add your phone number for recruiters to reach you'
  } else if (!state.step1.linkedinUrl.trim()) {
    nextAction = 'Add your LinkedIn profile — the #1 signal recruiters look for'
  } else if (!state.step3.resume) {
    nextAction = 'Upload your resume to enable AI-powered job applications'
  } else {
    nextAction = 'Your profile is ready — start applying!'
  }

  return { percentage, tier, nextAction, filledWeight }
}
